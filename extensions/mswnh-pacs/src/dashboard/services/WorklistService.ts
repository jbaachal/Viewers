import type {
  DashboardAlert,
  Study,
  StudyNote,
  StudyPriority,
  StudyQuery,
  StudyQueryResult,
} from '../models';

export type AddStudyNoteInput = Pick<StudyNote, 'type' | 'text' | 'popupOnOpen'>;

export interface WorklistService {
  queryStudies(query?: StudyQuery): Promise<StudyQueryResult>;
  getAlerts(): Promise<DashboardAlert[]>;
  searchStudies(search: string, limit?: number): Promise<Study[]>;
  getStudy(studyId: string): Promise<Study | null>;
  assignToMe(studyId: string): Promise<Study>;
  assign(studyId: string, radiologistId: string, radiologistName: string): Promise<Study>;
  reserve(studyId: string): Promise<Study>;
  releaseReservation(studyId: string): Promise<Study>;
  openStudy(studyId: string): Promise<Study>;
  startReporting(studyId: string): Promise<Study>;
  markReported(studyId: string): Promise<Study>;
  markVerified(studyId: string): Promise<Study>;
  changePriority(studyId: string, priority: StudyPriority, reason?: string): Promise<Study>;
  addStudyNote(studyId: string, note: AddStudyNoteInput): Promise<StudyNote>;
  subscribe(listener: () => void): () => void;
}
