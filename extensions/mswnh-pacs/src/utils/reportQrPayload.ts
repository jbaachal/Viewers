export function createReportQrPayload(studyId: string, reportId: string): string {
  return JSON.stringify({ version: 1, studyId, reportId });
}
