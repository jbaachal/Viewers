import type {
  DashboardAlert,
  Study,
  StudyPriority,
  StudyQuery,
  StudyQueryResult,
  StudyStatus,
  WorkflowEvent,
} from '../models';
import type { MockDataStore } from '../mock';
import { MOCK_CURRENT_RADIOLOGIST_ID } from '../mock';
import type { AddStudyNoteInput, WorklistService } from './WorklistService';
import {
  cloneValue,
  MockEntityNotFoundError,
  MockWorkflowConflictError,
  MockWorkflowValidationError,
} from './serviceUtils';

const priorityOrder: Record<StudyPriority, number> = {
  EMERGENCY: 0,
  URGENT: 1,
  ROUTINE: 2,
};

const unreadStatuses: StudyStatus[] = ['RECEIVED', 'ASSIGNED', 'IN_REVIEW'];

function dateKey(value: string | Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Kampala',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(candidate => candidate.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function includesSearch(study: Study, rawSearch: string): boolean {
  const search = rawSearch.trim().toLocaleLowerCase();
  if (!search) {
    return true;
  }
  return [
    study.patient.name,
    study.patient.id,
    study.patient.mrn,
    study.accessionNumber ?? '',
    study.studyInstanceUid,
    study.examination,
  ].some(value => value.toLocaleLowerCase().includes(search));
}

function matchesQuickFilters(
  study: Study,
  filters: NonNullable<StudyQuery['quickFilters']>,
  currentRadiologistId: string,
  now: Date
): boolean {
  return filters.every(filter => {
    switch (filter) {
      case 'EMERGENCY':
        return study.priority === 'EMERGENCY';
      case 'URGENT':
        return study.priority === 'URGENT';
      case 'UNREAD':
        return unreadStatuses.includes(study.status);
      case 'ASSIGNED_TO_ME':
        return study.assignedRadiologistId === currentRadiologistId;
      case 'UNASSIGNED':
        return study.assignedRadiologistId === null;
      case 'RESERVED_BY_ME':
        return study.reservedByRadiologistId === currentRadiologistId;
      case 'IN_REVIEW':
        return study.status === 'IN_REVIEW';
      case 'AWAITING_VERIFICATION':
        return study.status === 'REPORTED';
      case 'OVERDUE':
        return unreadStatuses.includes(study.status) && new Date(study.reportDueAt) < now;
      case 'CT':
        return study.modality === 'CT';
      case 'ULTRASOUND':
        return study.modality === 'US';
      case 'TODAY':
        return dateKey(study.receivedAt) === dateKey(now);
      default:
        return true;
    }
  });
}

function compareStudies(left: Study, right: Study, query: StudyQuery): number {
  const direction = query.sortDirection === 'desc' ? -1 : 1;
  if (!query.sortBy) {
    return (
      priorityOrder[left.priority] - priorityOrder[right.priority] ||
      new Date(left.receivedAt).getTime() - new Date(right.receivedAt).getTime()
    );
  }

  let result = 0;
  switch (query.sortBy) {
    case 'priority':
      result = priorityOrder[left.priority] - priorityOrder[right.priority];
      break;
    case 'receivedAt':
      result = left.receivedAt.localeCompare(right.receivedAt);
      break;
    case 'patientName':
      result = left.patient.name.localeCompare(right.patient.name);
      break;
    case 'examination':
      result = left.examination.localeCompare(right.examination);
      break;
    case 'status':
      result = left.status.localeCompare(right.status);
      break;
  }
  return result * direction;
}

export class MockWorklistService implements WorklistService {
  constructor(
    private readonly store: MockDataStore,
    private readonly currentRadiologistId = MOCK_CURRENT_RADIOLOGIST_ID,
    private readonly now: () => Date = () => new Date()
  ) {}

  async queryStudies(query: StudyQuery = {}): Promise<StudyQueryResult> {
    const page = Math.max(query.page ?? 1, 1);
    const pageSize = Math.max(query.pageSize ?? 20, 1);
    const now = this.now();
    this.store.studies.forEach(study => this.expireReservation(study, now));
    const studies = this.store.studies
      .filter(study => includesSearch(study, query.search ?? ''))
      .filter(study => !query.priorities?.length || query.priorities.includes(study.priority))
      .filter(study => !query.statuses?.length || query.statuses.includes(study.status))
      .filter(study => !query.modalities?.length || query.modalities.includes(study.modality))
      .filter(
        study => !query.assignedToMe || study.assignedRadiologistId === this.currentRadiologistId
      )
      .filter(study => !query.dateFrom || study.receivedAt >= query.dateFrom)
      .filter(study => !query.dateTo || study.receivedAt <= query.dateTo)
      .filter(study =>
        matchesQuickFilters(study, query.quickFilters ?? [], this.currentRadiologistId, now)
      )
      .sort((left, right) => compareStudies(left, right, query));
    const start = (page - 1) * pageSize;

    return cloneValue({
      studies: studies.slice(start, start + pageSize),
      total: studies.length,
      page,
      pageSize,
    });
  }

  async getAlerts(): Promise<DashboardAlert[]> {
    const now = this.now();
    return this.store.studies
      .filter(
        study =>
          Boolean(study.reportDueAt) &&
          unreadStatuses.includes(study.status) &&
          new Date(study.reportDueAt!).getTime() <= now.getTime() + 30 * 60_000
      )
      .map(study => {
        const minutes = Math.ceil(
          (new Date(study.reportDueAt!).getTime() - now.getTime()) / 60_000
        );
        return {
          id: `sla:${study.id}`,
          severity: minutes <= 0 && study.priority === 'EMERGENCY' ? 'CRITICAL' : 'WARNING',
          title: minutes <= 0 ? 'Reporting SLA breached' : 'Reporting SLA due soon',
          message:
            minutes <= 0
              ? `${study.priority} ${study.modality} study is ${Math.abs(minutes)} minutes overdue.`
              : `${study.priority} ${study.modality} study is due in ${minutes} minutes.`,
          occurredAt: study.reportDueAt!,
          acknowledged: false,
          studyId: study.id,
        } as DashboardAlert;
      });
  }

  async searchStudies(search: string, limit = 8): Promise<Study[]> {
    return cloneValue(
      this.store.studies.filter(study => includesSearch(study, search)).slice(0, limit)
    );
  }

  async getStudy(studyId: string): Promise<Study | null> {
    const study = this.store.studies.find(candidate => candidate.id === studyId);
    if (study) this.expireReservation(study, this.now());
    return study ? cloneValue(study) : null;
  }

  async assignToMe(studyId: string): Promise<Study> {
    const study = this.requireStudy(studyId);
    if (study.assignedRadiologistId && study.assignedRadiologistId !== this.currentRadiologistId) {
      throw new MockWorkflowConflictError('This study is already assigned to another radiologist.');
    }
    if (!['RECEIVED', 'ASSIGNED'].includes(study.status)) {
      throw new MockWorkflowValidationError('Only received or assigned studies can be claimed.');
    }
    study.assignedRadiologistId = this.currentRadiologistId;
    study.assignedAt ??= this.now().toISOString();
    if (study.status === 'RECEIVED') study.status = 'ASSIGNED';
    this.recordEvent(study, 'STUDY_ASSIGNED', 'Study assigned to the current radiologist');
    return this.finishUpdate(study);
  }

  async assign(studyId: string, radiologistId: string, radiologistName: string): Promise<Study> {
    const study = this.requireStudy(studyId);
    if (!['RECEIVED', 'ASSIGNED'].includes(study.status)) {
      throw new MockWorkflowValidationError('Only received or assigned studies can be assigned.');
    }
    study.assignedRadiologistId = radiologistId;
    study.assignedRadiologistName = radiologistName;
    study.assignedAt = this.now().toISOString();
    if (study.status === 'RECEIVED') study.status = 'ASSIGNED';
    this.recordEvent(study, 'STUDY_ASSIGNED', `Study assigned to ${radiologistName}`);
    return this.finishUpdate(study);
  }

  async reserve(studyId: string): Promise<Study> {
    const study = this.requireStudy(studyId);
    const now = this.now();
    this.expireReservation(study, now);
    if (
      study.reservedByRadiologistId &&
      study.reservedByRadiologistId !== this.currentRadiologistId
    ) {
      throw new MockWorkflowConflictError('Another radiologist currently holds this reservation.');
    }
    study.reservedByRadiologistId = this.currentRadiologistId;
    study.reservedByRadiologistName = 'Current user';
    study.reservationExpiresAt = new Date(now.getTime() + 15 * 60_000).toISOString();
    this.recordEvent(study, 'STATUS_CHANGED', 'Study reserved for 15 minutes');
    return this.finishUpdate(study);
  }

  async releaseReservation(studyId: string): Promise<Study> {
    const study = this.requireStudy(studyId);
    this.expireReservation(study, this.now());
    if (
      study.reservedByRadiologistId &&
      study.reservedByRadiologistId !== this.currentRadiologistId
    ) {
      throw new MockWorkflowConflictError('Only the reservation owner can release this study.');
    }
    study.reservedByRadiologistId = null;
    study.reservedByRadiologistName = null;
    study.reservationExpiresAt = null;
    this.recordEvent(study, 'STATUS_CHANGED', 'Study reservation released');
    return this.finishUpdate(study);
  }

  async openStudy(studyId: string): Promise<Study> {
    const study = this.requireStudy(studyId);
    this.assertAvailableToCurrentRadiologist(study);
    if (!study.firstOpenedAt) {
      study.firstOpenedAt = this.now().toISOString();
      this.recordEvent(study, 'STUDY_OPENED', 'Study opened from the radiologist worklist');
      return this.finishUpdate(study);
    }
    return cloneValue(study);
  }

  async startReporting(studyId: string): Promise<Study> {
    const study = this.requireStudy(studyId);
    this.assertAssignedToCurrentRadiologist(study);
    this.assertStatus(study, 'ASSIGNED', 'Only assigned studies can move to In Review.');
    study.status = 'IN_REVIEW';
    study.reportingStartedAt = this.now().toISOString();
    this.recordEvent(study, 'STATUS_CHANGED', 'Reporting started');
    return this.finishUpdate(study);
  }

  async markReported(studyId: string): Promise<Study> {
    const study = this.requireStudy(studyId);
    this.assertAssignedToCurrentRadiologist(study);
    this.assertStatus(study, 'IN_REVIEW', 'Only studies in review can be marked Reported.');
    study.status = 'REPORTED';
    study.reportedAt = this.now().toISOString();
    this.recordEvent(study, 'REPORT_COMPLETED', 'Study marked as reported');
    return this.finishUpdate(study);
  }

  async markVerified(studyId: string): Promise<Study> {
    const study = this.requireStudy(studyId);
    this.assertStatus(study, 'REPORTED', 'Only reported studies can be verified.');
    study.status = 'VERIFIED';
    study.verifiedAt = this.now().toISOString();
    this.recordEvent(study, 'REPORT_VERIFIED', 'Report verified');
    return this.finishUpdate(study);
  }

  async changePriority(studyId: string, priority: StudyPriority, reason?: string): Promise<Study> {
    const study = this.requireStudy(studyId);
    const emergencyChanged = study.priority === 'EMERGENCY' || priority === 'EMERGENCY';
    if (emergencyChanged && study.priority !== priority && !reason?.trim()) {
      throw new MockWorkflowValidationError(
        'A reason is required when changing to or from Emergency priority.'
      );
    }
    const previousPriority = study.priority;
    study.priority = priority;
    this.recordEvent(
      study,
      'PRIORITY_CHANGED',
      `Priority changed from ${previousPriority} to ${priority}${reason?.trim() ? `: ${reason.trim()}` : ''}`
    );
    return this.finishUpdate(study);
  }

  async addStudyNote(studyId: string, input: AddStudyNoteInput) {
    const study = this.requireStudy(studyId);
    const note = {
      id: `note-${studyId}-${this.now().getTime()}`,
      studyId,
      ...input,
      createdBy: 'Dr Sarah Akello',
      createdAt: this.now().toISOString(),
    };
    study.notes.unshift(note);
    study.workflowHistory.unshift({
      id: `event-${studyId}-note-${this.now().getTime()}`,
      studyId,
      type: 'NOTE_ADDED',
      description: `${input.type.toLowerCase()} note added`,
      actor: 'Dr Sarah Akello',
      occurredAt: note.createdAt,
    });
    this.notify();
    return cloneValue(note);
  }

  subscribe(listener: () => void): () => void {
    this.store.listeners.add(listener);
    return () => this.store.listeners.delete(listener);
  }

  private requireStudy(studyId: string): Study {
    const study = this.store.studies.find(candidate => candidate.id === studyId);
    if (!study) throw new MockEntityNotFoundError('Study', studyId);
    return study;
  }

  private expireReservation(study: Study, now: Date): void {
    if (study.reservationExpiresAt && new Date(study.reservationExpiresAt) <= now) {
      study.reservedByRadiologistId = null;
      study.reservationExpiresAt = null;
    }
  }

  private assertAvailableToCurrentRadiologist(study: Study): void {
    this.expireReservation(study, this.now());
    if (
      study.reservedByRadiologistId &&
      study.reservedByRadiologistId !== this.currentRadiologistId
    ) {
      throw new MockWorkflowConflictError('This study is reserved by another radiologist.');
    }
  }

  private assertAssignedToCurrentRadiologist(study: Study): void {
    if (study.assignedRadiologistId !== this.currentRadiologistId) {
      throw new MockWorkflowConflictError('Assign this study to yourself before reporting.');
    }
  }

  private assertStatus(study: Study, expected: StudyStatus, message: string): void {
    if (study.status !== expected) throw new MockWorkflowValidationError(message);
  }

  private recordEvent(study: Study, type: WorkflowEvent['type'], description: string): void {
    study.workflowHistory.unshift({
      id: `event-${study.id}-${this.now().getTime()}-${study.workflowHistory.length}`,
      studyId: study.id,
      type,
      description,
      actor: 'Dr Sarah Akello',
      occurredAt: this.now().toISOString(),
    });
  }

  private finishUpdate(study: Study): Study {
    this.notify();
    return cloneValue(study);
  }

  private notify() {
    this.store.listeners.forEach(listener => listener());
  }
}
