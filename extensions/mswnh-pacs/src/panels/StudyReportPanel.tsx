import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DicomMetadataStore, useSystem, utils } from '@ohif/core';

import {
  createStudyReport,
  getStudyReport,
  SaveStudyReportRequest,
  StudyReport,
  StudyReportsApiError,
  updateStudyReport,
} from '../services/StudyReportsService';

const EMPTY_FORM: SaveStudyReportRequest = {
  subject: '',
  technique: '',
  findings: '',
  conclusion: '',
  signReport: false,
};

type StudyContext = {
  studyInstanceUid: string;
  patientName: string;
  patientId: string;
  sex: string;
  birthDateOrAge: string;
  history: string;
  studyDate: string;
};

const styles: Record<string, React.CSSProperties> = {
  panel: { padding: 16, height: '100%', overflowY: 'auto', color: '#f3f4f6' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  row: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  card: { marginTop: 12, padding: 12, border: '1px solid #374151', borderRadius: 6 },
  demographics: {
    marginTop: 12,
    padding: 12,
    border: '1px solid #164e63',
    borderRadius: 6,
    background: '#082f49',
  },
  grid: { display: 'grid', gridTemplateColumns: 'minmax(90px, 0.8fr) 1.4fr', gap: '6px 10px' },
  label: { fontSize: 11, color: '#9ca3af' },
  value: { fontSize: 12, color: '#f3f4f6', overflowWrap: 'anywhere' },
  field: {
    width: '100%',
    marginTop: 4,
    border: '1px solid #4b5563',
    borderRadius: 4,
    padding: 8,
    background: '#111827',
    color: '#fff',
  },
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
};

function valueOrUnknown(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value : 'Not available';
}

function formatAge(birthDate: unknown, studyDate: unknown, patientAge: unknown): string {
  if (typeof patientAge === 'string' && patientAge) {
    return patientAge;
  }
  if (typeof birthDate !== 'string' || !/^\d{8}$/.test(birthDate)) {
    return 'Not available';
  }
  const end = typeof studyDate === 'string' && /^\d{8}$/.test(studyDate) ? studyDate : undefined;
  const birth = new Date(
    `${birthDate.slice(0, 4)}-${birthDate.slice(4, 6)}-${birthDate.slice(6, 8)}T00:00:00`
  );
  const reference = end
    ? new Date(`${end.slice(0, 4)}-${end.slice(4, 6)}-${end.slice(6, 8)}T00:00:00`)
    : new Date();
  let years = reference.getFullYear() - birth.getFullYear();
  if (
    reference.getMonth() < birth.getMonth() ||
    (reference.getMonth() === birth.getMonth() && reference.getDate() < birth.getDate())
  ) {
    years -= 1;
  }
  return years >= 0 ? `${years} years` : 'Not available';
}

function getStudyContext(displaySetService): StudyContext | null {
  const displaySet = displaySetService.getActiveDisplaySets()?.[0];
  const studyInstanceUid = displaySet?.StudyInstanceUID;
  if (!studyInstanceUid) {
    return null;
  }

  const study = DicomMetadataStore.getStudy(studyInstanceUid) || {};
  const instance = displaySet?.instances?.[0] || displaySet?.instance || {};
  const metadata = { ...study, ...displaySet, ...instance };
  const birthDate = metadata.PatientBirthDate;
  const age = formatAge(birthDate, metadata.StudyDate, metadata.PatientAge);
  const formattedBirthDate = typeof birthDate === 'string' ? utils.formatDate(birthDate) : '';
  const birthDateOrAge = formattedBirthDate ? `${formattedBirthDate} (${age})` : age;

  return {
    studyInstanceUid,
    patientName: metadata.PatientName ? utils.formatPN(metadata.PatientName) : 'Not available',
    patientId: valueOrUnknown(metadata.PatientID),
    sex: valueOrUnknown(metadata.PatientSex),
    birthDateOrAge,
    history: valueOrUnknown(
      metadata.AdditionalPatientHistory ||
        metadata.ReasonForTheRequestedProcedure ||
        metadata.RequestedProcedureDescription
    ),
    studyDate: metadata.StudyDate ? utils.formatDate(metadata.StudyDate) : 'Not available',
  };
}

export default function StudyReportPanel() {
  const { servicesManager } = useSystem();
  const { displaySetService, userAuthenticationService } = servicesManager.services;
  const [context, setContext] = useState<StudyContext | null>(null);
  const [report, setReport] = useState<StudyReport | null>(null);
  const [form, setForm] = useState<SaveStudyReportRequest>(EMPTY_FORM);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestController = useRef<AbortController | null>(null);

  const authorizationHeaders = useCallback(
    () => userAuthenticationService.getAuthorizationHeader?.() || {},
    [userAuthenticationService]
  );

  const loadReport = useCallback(async () => {
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    const currentContext = getStudyContext(displaySetService);
    setContext(currentContext);
    setEditing(false);
    setError(null);
    if (!currentContext) {
      setReport(null);
      setError('No active study is available.');
      return;
    }

    setLoading(true);
    try {
      setReport(
        await getStudyReport(currentContext.studyInstanceUid, {
          authorizationHeaders: authorizationHeaders(),
          signal: controller.signal,
        })
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err.message : 'Unable to load the study report.');
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [authorizationHeaders, displaySetService]);

  useEffect(() => {
    loadReport();
    const subscriptions = [
      displaySetService.subscribe(displaySetService.EVENTS.DISPLAY_SETS_CHANGED, loadReport),
      displaySetService.subscribe(displaySetService.EVENTS.DISPLAY_SETS_ADDED, loadReport),
    ];
    return () => {
      requestController.current?.abort();
      subscriptions.forEach(subscription => subscription.unsubscribe());
    };
  }, [displaySetService, loadReport]);

  const beginEditing = () => {
    setForm(
      report
        ? {
            subject: report.subject,
            technique: report.technique,
            findings: report.findings,
            conclusion: report.conclusion,
            signReport: report.isReported,
          }
        : EMPTY_FORM
    );
    setEditing(true);
    setError(null);
  };

  const save = async (signReport: boolean) => {
    if (!context) {
      return;
    }
    if (
      ![form.subject, form.technique, form.findings, form.conclusion].every(value => value.trim())
    ) {
      setError('Subject, technique, findings, and conclusion are required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const request = { ...form, signReport };
      const options = { authorizationHeaders: authorizationHeaders() };
      const result = report
        ? await updateStudyReport(context.studyInstanceUid, report.version, request, options)
        : await createStudyReport(context.studyInstanceUid, request, options);
      setReport(result);
      setEditing(false);
    } catch (err) {
      setError(
        err instanceof StudyReportsApiError && err.status === 403
          ? 'Only authorized radiologists and PACS administrators can create or edit study reports.'
          : err instanceof Error
            ? err.message
            : 'Unable to save the study report.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Study Report</h2>
        <div style={styles.row}>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={loadReport}
            disabled={loading}
          >
            Refresh
          </button>
          {!editing && (
            <button
              type="button"
              style={styles.button}
              onClick={beginEditing}
              disabled={!context}
            >
              {report ? 'Edit' : 'Create'}
            </button>
          )}
        </div>
      </div>

      {context && (
        <section
          style={styles.demographics}
          aria-label="Patient and study details"
        >
          <div style={styles.grid}>
            <span style={styles.label}>Patient name</span>
            <span style={styles.value}>{context.patientName}</span>
            <span style={styles.label}>DOB / Age</span>
            <span style={styles.value}>{context.birthDateOrAge}</span>
            <span style={styles.label}>Gender</span>
            <span style={styles.value}>{context.sex}</span>
            <span style={styles.label}>Patient ID</span>
            <span style={styles.value}>{context.patientId}</span>
            <span style={styles.label}>Study date</span>
            <span style={styles.value}>{context.studyDate}</span>
            <span style={styles.label}>History</span>
            <span style={styles.value}>{context.history}</span>
          </div>
        </section>
      )}

      {error && (
        <div
          role="alert"
          style={{ ...styles.card, borderColor: '#ef4444' }}
        >
          {error}
        </div>
      )}
      {loading && <div style={styles.card}>Loading report...</div>}

      {!loading && report && !editing && (
        <article style={styles.card}>
          <div style={styles.header}>
            <strong>{report.subject}</strong>
            <span
              style={{
                borderRadius: 999,
                padding: '3px 8px',
                fontSize: 11,
                fontWeight: 700,
                color: report.isReported ? '#052e16' : '#451a03',
                background: report.isReported ? '#4ade80' : '#fbbf24',
              }}
            >
              {report.isReported ? 'REPORTED' : 'DRAFT'}
            </span>
          </div>
          {(['Technique', 'Findings', 'Conclusion'] as const).map(label => (
            <section
              key={label}
              style={{ marginTop: 14 }}
            >
              <div style={styles.label}>{label}</div>
              <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                {report[label.toLowerCase() as 'technique' | 'findings' | 'conclusion']}
              </div>
            </section>
          ))}
          <div style={{ ...styles.label, marginTop: 14 }}>
            Reported by: {report.reportedByName || report.reportedBy || 'Not signed'}
          </div>
          <div style={styles.label}>
            Report signed time:{' '}
            {report.reportSignedAt
              ? new Date(report.reportSignedAt).toLocaleString()
              : 'Not signed'}
          </div>
        </article>
      )}

      {!loading && !report && !editing && !error && (
        <div style={styles.card}>
          <span style={{ color: '#fbbf24', fontWeight: 700 }}>DRAFT</span>
          <div style={{ marginTop: 6 }}>No report has been created for this study.</div>
        </div>
      )}

      {editing && (
        <form
          style={styles.card}
          onSubmit={event => event.preventDefault()}
        >
          {(['subject', 'technique', 'findings', 'conclusion'] as const).map(field => (
            <label
              key={field}
              style={{ display: 'block', marginTop: 10 }}
            >
              <span style={styles.label}>{field.charAt(0).toUpperCase() + field.slice(1)}</span>
              {field === 'subject' ? (
                <input
                  style={styles.field}
                  maxLength={500}
                  required
                  value={form[field]}
                  onChange={event =>
                    setForm(current => ({ ...current, [field]: event.target.value }))
                  }
                />
              ) : (
                <textarea
                  style={{ ...styles.field, resize: 'vertical' }}
                  rows={field === 'findings' ? 8 : 4}
                  maxLength={field === 'findings' ? 20000 : 10000}
                  required
                  value={form[field]}
                  onChange={event =>
                    setForm(current => ({ ...current, [field]: event.target.value }))
                  }
                />
              )}
            </label>
          ))}
          <div style={{ ...styles.row, marginTop: 14 }}>
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => save(false)}
              disabled={saving}
            >
              Save draft
            </button>
            <button
              type="button"
              style={styles.button}
              onClick={() => save(true)}
              disabled={saving}
            >
              Save & sign
            </button>
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
