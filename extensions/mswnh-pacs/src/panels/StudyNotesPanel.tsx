import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSystem } from '@ohif/core';

import {
  createStudyNote,
  deleteStudyNote,
  getStudyNotes,
  SaveStudyNoteRequest,
  StudyNote,
  StudyNotesApiError,
  updateStudyNote,
} from '../services/StudyNotesService';

const EMPTY_FORM: SaveStudyNoteRequest = {
  noteType: 'GENERAL',
  noteText: '',
  popupOnOpen: false,
};

const NOTE_TYPES = ['GENERAL', 'CLINICAL', 'RADIOLOGY', 'TECHNICAL', 'URGENT'];

const styles: Record<string, React.CSSProperties> = {
  panel: {
    padding: 16,
    height: '100%',
    overflowY: 'auto',
    color: '#f3f4f6',
  },
  row: { display: 'flex', alignItems: 'center', gap: 8 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  button: {
    border: '1px solid #3b82f6',
    borderRadius: 4,
    padding: '6px 10px',
    background: '#172554',
    color: '#fff',
    cursor: 'pointer',
  },
  secondaryButton: {
    border: '1px solid #4b5563',
    borderRadius: 4,
    padding: '6px 10px',
    background: '#111827',
    color: '#fff',
    cursor: 'pointer',
  },
  dangerButton: {
    border: '1px solid #ef4444',
    borderRadius: 4,
    padding: '6px 10px',
    background: '#450a0a',
    color: '#fff',
    cursor: 'pointer',
  },
  field: {
    width: '100%',
    border: '1px solid #4b5563',
    borderRadius: 4,
    padding: 8,
    background: '#111827',
    color: '#fff',
  },
  card: { marginTop: 12, padding: 12, border: '1px solid #374151', borderRadius: 6 },
  muted: { fontSize: 11, color: '#9ca3af' },
};

export default function StudyNotesPanel() {
  const { servicesManager } = useSystem();
  const { displaySetService, userAuthenticationService } = servicesManager.services;

  const [studyInstanceUid, setStudyInstanceUid] = useState<string | null>(null);
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [form, setForm] = useState<SaveStudyNoteRequest>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingVersion, setEditingVersion] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestController = useRef<AbortController | null>(null);

  const getAuthorizationHeaders = useCallback(
    () => userAuthenticationService.getAuthorizationHeader?.() || {},
    [userAuthenticationService]
  );

  const findCurrentStudyInstanceUid = useCallback(() => {
    const displaySets = displaySetService.getActiveDisplaySets();
    return displaySets?.map(displaySet => displaySet.StudyInstanceUID).find(Boolean) || null;
  }, [displaySetService]);

  const loadNotes = useCallback(
    async (requestedUid = findCurrentStudyInstanceUid()) => {
      requestController.current?.abort();
      const controller = new AbortController();
      requestController.current = controller;
      setStudyInstanceUid(requestedUid);
      setEditingId(null);
      setEditingVersion(null);
      setShowForm(false);

      if (!requestedUid) {
        setNotes([]);
        setError('No active study is available. Open a study and try again.');
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const result = await getStudyNotes(requestedUid, {
          authorizationHeaders: getAuthorizationHeaders(),
          signal: controller.signal,
        });
        setNotes(result);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        console.error('Unable to load Study Notes', err);
        setError(err instanceof Error ? err.message : 'Unable to load Study Notes.');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [findCurrentStudyInstanceUid, getAuthorizationHeaders]
  );

  useEffect(() => {
    loadNotes();
    const subscriptions = [
      displaySetService.subscribe(displaySetService.EVENTS.DISPLAY_SETS_CHANGED, () => loadNotes()),
      displaySetService.subscribe(displaySetService.EVENTS.DISPLAY_SETS_ADDED, () => loadNotes()),
    ];
    return () => {
      requestController.current?.abort();
      subscriptions.forEach(subscription => subscription.unsubscribe());
    };
  }, [displaySetService, loadNotes]);

  const startCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setEditingVersion(null);
    setShowForm(true);
    setError(null);
  };

  const startEdit = (note: StudyNote) => {
    setForm({ noteType: note.noteType, noteText: note.noteText, popupOnOpen: note.popupOnOpen });
    setEditingId(note.id);
    setEditingVersion(note.version);
    setShowForm(true);
    setError(null);
  };

  const saveNote = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!studyInstanceUid || !form.noteText.trim()) {
      setError('Note text is required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const options = { authorizationHeaders: getAuthorizationHeaders() };
      if (editingId && editingVersion) {
        await updateStudyNote(studyInstanceUid, editingId, editingVersion, form, options);
      } else {
        await createStudyNote(studyInstanceUid, form, options);
      }
      setShowForm(false);
      setEditingId(null);
      setEditingVersion(null);
      setForm(EMPTY_FORM);
      await loadNotes(studyInstanceUid);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save the note.');
    } finally {
      setSaving(false);
    }
  };

  const removeNote = async (note: StudyNote) => {
    if (!studyInstanceUid || !window.confirm('Delete this study note?')) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await deleteStudyNote(studyInstanceUid, note.id, note.version, {
        authorizationHeaders: getAuthorizationHeaders(),
      });
      await loadNotes(studyInstanceUid);
    } catch (err) {
      setError(
        err instanceof StudyNotesApiError && err.status === 403
          ? 'You do not have permission to delete this note. Only authorized radiologists and PACS administrators can delete study notes.'
          : err instanceof Error
            ? err.message
            : 'Unable to delete the note.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Notes</h2>
        <div style={styles.row}>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => loadNotes()}
            disabled={loading}
          >
            Refresh
          </button>
          <button
            type="button"
            style={styles.button}
            onClick={startCreate}
            disabled={!studyInstanceUid || saving}
          >
            Add note
          </button>
        </div>
      </div>

      {studyInstanceUid && (
        <div style={{ ...styles.muted, marginTop: 8, wordBreak: 'break-all' }}>
          Study UID: {studyInstanceUid}
        </div>
      )}
      {error && (
        <div
          role="alert"
          style={{ ...styles.card, borderColor: '#ef4444' }}
        >
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={saveNote}
          style={styles.card}
        >
          <strong>{editingId ? 'Edit note' : 'New note'}</strong>
          <label style={{ display: 'block', marginTop: 10 }}>
            <span style={styles.muted}>Type</span>
            <select
              style={styles.field}
              value={form.noteType}
              onChange={event => setForm(current => ({ ...current, noteType: event.target.value }))}
            >
              {NOTE_TYPES.map(noteType => (
                <option
                  key={noteType}
                  value={noteType}
                >
                  {noteType}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: 'block', marginTop: 10 }}>
            <span style={styles.muted}>Note</span>
            <textarea
              autoFocus
              rows={5}
              maxLength={10000}
              required
              style={{ ...styles.field, resize: 'vertical' }}
              value={form.noteText}
              onChange={event => setForm(current => ({ ...current, noteText: event.target.value }))}
            />
          </label>
          <label style={{ ...styles.row, marginTop: 10 }}>
            <input
              type="checkbox"
              checked={form.popupOnOpen}
              onChange={event =>
                setForm(current => ({ ...current, popupOnOpen: event.target.checked }))
              }
            />
            Highlight when the study opens
          </label>
          <div style={{ ...styles.row, marginTop: 12 }}>
            <button
              type="submit"
              style={styles.button}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => setShowForm(false)}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading && <div style={styles.card}>Loading Study Notes…</div>}
      {!loading && !error && notes.length === 0 && (
        <div style={styles.card}>No Study Notes have been recorded for this study.</div>
      )}

      {!loading &&
        notes.map(note => (
          <article
            key={note.id}
            style={{ ...styles.card, borderColor: note.popupOnOpen ? '#f59e0b' : '#374151' }}
          >
            <div style={styles.header}>
              <div style={styles.row}>
                <strong>{note.noteType}</strong>
                {note.popupOnOpen && (
                  <span style={{ color: '#fbbf24', fontSize: 11 }}>HIGHLIGHT</span>
                )}
              </div>
              <div style={styles.row}>
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={() => startEdit(note)}
                  disabled={saving}
                >
                  Edit
                </button>
                <button
                  type="button"
                  style={styles.dangerButton}
                  onClick={() => removeNote(note)}
                  disabled={saving}
                >
                  Delete
                </button>
              </div>
            </div>
            <div style={{ margin: '10px 0', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
              {note.noteText}
            </div>
            <div style={styles.muted}>
              {note.createdByName || note.createdBy}
              {note.createdByRole ? ` — ${note.createdByRole}` : ''}
            </div>
            <div style={styles.muted}>
              Created {new Date(note.createdAt).toLocaleString()}
              {note.updatedAt ? ` · Updated ${new Date(note.updatedAt).toLocaleString()}` : ''}
            </div>
          </article>
        ))}
    </div>
  );
}
