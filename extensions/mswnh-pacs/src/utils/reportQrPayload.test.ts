import { createReportQrPayload } from './reportQrPayload';

describe('createReportQrPayload', () => {
  it('contains the Study UID and Report ID without patient information', () => {
    const payload = createReportQrPayload('1.2.840.123', 'report-123');

    expect(JSON.parse(payload)).toEqual({
      version: 1,
      studyId: '1.2.840.123',
      reportId: 'report-123',
    });
    expect(payload).not.toContain('patient');
  });
});
