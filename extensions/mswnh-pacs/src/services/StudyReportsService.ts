export type StudyReport = {
  id: string;
  studyInstanceUid: string;
  subject: string;
  comparison: string;
  technique: string;
  findings: string;
  conclusion: string;
  recommendation?: string;
  isReported: boolean;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedBy?: string;
  updatedByName?: string;
  updatedAt?: string;
  reportedBy?: string;
  reportedByName?: string;
  reportSignedAt?: string;
  hasSignature?: boolean;
  signatureWidth?: number;
  signatureHeight?: number;
  version: string;
};

export type SaveStudyReportRequest = {
  subject: string;
  comparison: string;
  technique: string;
  findings: string;
  conclusion: string;
  recommendation?: string;
  signReport: boolean;
};

type RequestOptions = {
  authorizationHeaders: Record<string, string>;
  signal?: AbortSignal;
};

export class StudyReportsApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'StudyReportsApiError';
  }
}

function getReportUrl(studyInstanceUid: string): string {
  const baseUrl = (window.config?.workflowApi?.baseUrl || 'http://localhost:5255').replace(
    /\/$/,
    ''
  );
  return `${baseUrl}/api/studies/${encodeURIComponent(studyInstanceUid)}/report`;
}

async function parseError(response: Response): Promise<StudyReportsApiError> {
  const contentType = response.headers.get('content-type') || '';
  let detail = response.statusText;

  try {
    if (contentType.includes('json')) {
      const body = await response.json();
      detail = body.detail || body.title || JSON.stringify(body.errors || body);
    } else {
      detail = (await response.text()) || detail;
    }
  } catch {
    // Preserve the HTTP status if the response body is not readable.
  }

  return new StudyReportsApiError(
    response.status,
    `Study Report API returned ${response.status}: ${detail}`
  );
}

export async function getStudyReport(
  studyInstanceUid: string,
  { authorizationHeaders, signal }: RequestOptions
): Promise<StudyReport | null> {
  const response = await fetch(getReportUrl(studyInstanceUid), {
    method: 'GET',
    headers: { ...authorizationHeaders, Accept: 'application/json' },
    signal,
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw await parseError(response);
  }
  return response.json();
}

export async function getStudyReportSignature(
  studyInstanceUid: string,
  { authorizationHeaders, signal }: RequestOptions
): Promise<Blob | null> {
  const response = await fetch(`${getReportUrl(studyInstanceUid)}/signature`, {
    method: 'GET',
    headers: { ...authorizationHeaders, Accept: 'image/png,image/jpeg' },
    signal,
  });
  if (response.status === 404) return null;
  if (!response.ok) throw await parseError(response);
  return response.blob();
}

export async function createStudyReport(
  studyInstanceUid: string,
  report: SaveStudyReportRequest,
  { authorizationHeaders, signal }: RequestOptions
): Promise<StudyReport> {
  const response = await fetch(getReportUrl(studyInstanceUid), {
    method: 'POST',
    headers: {
      ...authorizationHeaders,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(report),
    signal,
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return response.json();
}

export async function updateStudyReport(
  studyInstanceUid: string,
  version: string,
  report: SaveStudyReportRequest,
  { authorizationHeaders, signal }: RequestOptions
): Promise<StudyReport> {
  const response = await fetch(getReportUrl(studyInstanceUid), {
    method: 'PUT',
    headers: {
      ...authorizationHeaders,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...report, version }),
    signal,
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return response.json();
}
