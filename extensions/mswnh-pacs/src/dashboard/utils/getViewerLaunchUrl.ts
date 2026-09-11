import type { Study } from '../models';

export function getViewerLaunchUrl(study: Study): string | null {
  if (!study.archiveStudyAvailable) return null;
  const query = new URLSearchParams({ StudyInstanceUIDs: study.studyInstanceUid });
  return `/viewer?${query.toString()}`;
}
