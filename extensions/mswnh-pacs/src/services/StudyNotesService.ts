export type StudyNote = {
  id: string;
  studyInstanceUid: string;
  noteType: string;
  noteText: string;
  popupOnOpen: boolean;
  createdBy: string;
  createdByName?: string;
  createdByRole?: string;
  createdAt: string;
  updatedAt?: string;
  version: string;
};

export type SaveStudyNoteRequest = {
  noteType: string;
  noteText: string;
  popupOnOpen: boolean;
};

type RequestOptions = {
  authorizationHeaders: Record<string, string>;
  signal?: AbortSignal;
};

function getBaseUrl(): string {
  return (window.config?.workflowApi?.baseUrl || 'http://localhost:5255').replace(/\/$/, '');
}

function getStudyNotesUrl(studyInstanceUid: string, noteId?: string): string {
  const notesUrl = `${getBaseUrl()}/api/studies/${encodeURIComponent(studyInstanceUid)}/notes`;
  return noteId ? `${notesUrl}/${encodeURIComponent(noteId)}` : notesUrl;
}

async function parseError(response: Response): Promise<Error> {
  const contentType = response.headers.get('content-type') || '';
  let detail = response.statusText;

  try {
    if (contentType.includes('application/json')) {
      const body = await response.json();
      detail = body.detail || body.title || JSON.stringify(body.errors || body);
    } else {
      detail = (await response.text()) || detail;
    }
  } catch {
    // Keep the HTTP status when the response body cannot be parsed.
  }

  return new Error(`Study Notes API returned ${response.status}: ${detail}`);
}

async function request<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw await parseError(response);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

export function getStudyNotes(
  studyInstanceUid: string,
  { authorizationHeaders, signal }: RequestOptions
): Promise<StudyNote[]> {
  return request(getStudyNotesUrl(studyInstanceUid), {
    method: 'GET',
    headers: { ...authorizationHeaders, Accept: 'application/json' },
    signal,
  });
}

export function createStudyNote(
  studyInstanceUid: string,
  note: SaveStudyNoteRequest,
  { authorizationHeaders, signal }: RequestOptions
): Promise<StudyNote> {
  return request(getStudyNotesUrl(studyInstanceUid), {
    method: 'POST',
    headers: {
      ...authorizationHeaders,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(note),
    signal,
  });
}

export function updateStudyNote(
  studyInstanceUid: string,
  noteId: string,
  version: string,
  note: SaveStudyNoteRequest,
  { authorizationHeaders, signal }: RequestOptions
): Promise<StudyNote> {
  return request(getStudyNotesUrl(studyInstanceUid, noteId), {
    method: 'PUT',
    headers: {
      ...authorizationHeaders,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...note, version }),
    signal,
  });
}

export function deleteStudyNote(
  studyInstanceUid: string,
  noteId: string,
  version: string,
  { authorizationHeaders, signal }: RequestOptions
): Promise<void> {
  const url = `${getStudyNotesUrl(studyInstanceUid, noteId)}?version=${encodeURIComponent(version)}`;
  return request(url, {
    method: 'DELETE',
    headers: { ...authorizationHeaders, Accept: 'application/json' },
    signal,
  });
}
