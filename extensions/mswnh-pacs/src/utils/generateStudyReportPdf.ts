import { jsPDF } from 'jspdf';

import type { StudyReport } from '../services/StudyReportsService';

export type StudyReportPdfContext = {
  studyInstanceUid: string;
  patientName: string;
  patientId: string;
  sex: string;
  birthDateOrAge: string;
  history: string;
  modality: string;
  accessionNumber: string;
  priority: string;
  studyDateTime: string;
  referralDateTime: string;
  referringClinician: string;
};

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN_X = 18;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const ACCENT = [25, 118, 163] as const;
const PALE_ACCENT = [234, 244, 248] as const;
const TEXT = [31, 41, 55] as const;
const MUTED = [100, 116, 139] as const;

function safeText(value: string | undefined | null): string {
  return value?.trim() || 'Not available';
}

function fileSafe(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || 'patient';
}

function formatDateTime(value: string | undefined): string {
  if (!value) {
    return 'Not signed';
  }
  return new Date(value).toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function loadHospitalLogo(): Promise<string | null> {
  try {
    const response = await fetch('/hospital-logo.svg', { credentials: 'same-origin' });
    if (!response.ok) {
      return null;
    }
    const blobUrl = URL.createObjectURL(await response.blob());
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = reject;
        element.src = blobUrl;
      });
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 400;
      const context = canvas.getContext('2d');
      if (!context) {
        return null;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/png');
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  } catch {
    return null;
  }
}

export async function createStudyReportPdf(
  report: StudyReport,
  context: StudyReportPdfContext
): Promise<jsPDF> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const logo = await loadHospitalLogo();
  let y = 14;

  pdf.setProperties({
    title: `Radiology Report - ${safeText(context.patientName)}`,
    subject: report.subject,
    author: safeText(report.reportedByName || report.reportedBy),
    creator: 'MSWNH PACS',
    keywords: `radiology,${context.studyInstanceUid}`,
  });

  const addPageHeader = (continuation = false) => {
    if (!continuation && logo) {
      pdf.addImage(logo, 'PNG', MARGIN_X, 8, 28, 18.7, undefined, 'FAST');
    }
    pdf.setTextColor(...ACCENT);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(continuation ? 12 : 17);
    pdf.text(
      continuation ? 'RADIOLOGY REPORT - CONTINUED' : 'RADIOLOGY REPORT',
      50,
      continuation ? 14 : 15
    );
    if (!continuation) {
      pdf.setFontSize(9);
      pdf.setTextColor(...TEXT);
      pdf.text('Mulago Specialised Women and Neonatal Hospital', 50, 21);
      pdf.setFontSize(7.5);
      pdf.setTextColor(...MUTED);
      pdf.text(`Report ID: ${report.id}`, PAGE_WIDTH - MARGIN_X, 13, { align: 'right' });
      pdf.text(`Study UID: ${context.studyInstanceUid}`, PAGE_WIDTH - MARGIN_X, 18, {
        align: 'right',
        maxWidth: 72,
      });
    }
    pdf.setDrawColor(...ACCENT);
    pdf.setLineWidth(0.6);
    pdf.line(MARGIN_X, continuation ? 18 : 29, PAGE_WIDTH - MARGIN_X, continuation ? 18 : 29);
    y = continuation ? 25 : 35;
  };

  const addNewPage = () => {
    pdf.addPage();
    addPageHeader(true);
  };

  const ensureSpace = (height: number) => {
    if (y + height > PAGE_HEIGHT - 22) {
      addNewPage();
    }
  };

  const addBandTitle = (title: string, note?: string) => {
    ensureSpace(10);
    pdf.setFillColor(...ACCENT);
    pdf.rect(MARGIN_X, y, CONTENT_WIDTH, 7, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.text(title, MARGIN_X + 3, y + 4.8);
    if (note) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.text(note, PAGE_WIDTH - MARGIN_X - 3, y + 4.7, { align: 'right' });
    }
    y += 9;
  };

  const addInfoRow = (items: Array<[string, string]>) => {
    const columnWidth = CONTENT_WIDTH / items.length;
    const wrappedValues = items.map(
      ([, value]) => pdf.splitTextToSize(safeText(value), columnWidth - 7) as string[]
    );
    const height = Math.max(13, 8 + Math.max(...wrappedValues.map(lines => lines.length)) * 3.3);
    ensureSpace(height);
    pdf.setFillColor(...PALE_ACCENT);
    pdf.rect(MARGIN_X, y, CONTENT_WIDTH, height - 1, 'F');
    items.forEach(([label], index) => {
      const x = MARGIN_X + index * columnWidth;
      if (index) {
        pdf.setDrawColor(213, 222, 229);
        pdf.line(x, y + 1, x, y + height - 2);
      }
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.8);
      pdf.setTextColor(...ACCENT);
      pdf.text(label, x + 3, y + 4);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(...TEXT);
      pdf.text(wrappedValues[index], x + 3, y + 8.2);
    });
    y += height;
  };

  const addNarrativeSection = (title: string, value: string, note?: string) => {
    const body = safeText(value);
    const lines = pdf.splitTextToSize(body, CONTENT_WIDTH - 6) as string[];
    const bodyHeight = Math.max(10, lines.length * 4.2 + 5);
    ensureSpace(9 + Math.min(bodyHeight, 30));
    addBandTitle(title, note);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    pdf.setTextColor(...TEXT);
    for (const line of lines) {
      if (y + 5 > PAGE_HEIGHT - 22) {
        addNewPage();
        addBandTitle(`${title} - CONTINUED`);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9.5);
        pdf.setTextColor(...TEXT);
      }
      pdf.text(line, MARGIN_X + 3, y + 3.5);
      y += 4.2;
    }
    y += 4;
  };

  addPageHeader();
  addBandTitle('PATIENT & STUDY INFORMATION');
  addInfoRow([
    ['PATIENT NAME', context.patientName],
    ['MEDICAL RECORD NO.', context.patientId],
  ]);
  addInfoRow([
    ['DATE OF BIRTH / AGE', context.birthDateOrAge],
    ['SEX', context.sex],
  ]);
  addInfoRow([
    ['MODALITY', context.modality],
    ['ACCESSION NO.', context.accessionNumber],
  ]);
  addInfoRow([
    ['PRIORITY', context.priority],
    ['STUDY DATE & TIME', context.studyDateTime],
  ]);
  addInfoRow([
    ['REFERRAL DATE & TIME', context.referralDateTime],
    ['REFERRING CLINICIAN', context.referringClinician],
  ]);

  addNarrativeSection('CLINICAL INFORMATION', context.history);
  addNarrativeSection('REPORT SUBJECT', report.subject);
  addNarrativeSection('COMPARISON', report.comparison);
  addNarrativeSection('TECHNIQUE', report.technique);
  addNarrativeSection('FINDINGS', report.findings);
  addNarrativeSection('IMPRESSION / CONCLUSION', report.conclusion);
  if (report.recommendation) {
    addNarrativeSection(
      'RECOMMENDATION',
      report.recommendation,
      'Complete only when clinically indicated'
    );
  }

  addBandTitle('RADIOLOGIST VERIFICATION');
  addInfoRow([
    ['REPORTED BY', report.reportedByName || report.reportedBy || 'Not signed'],
    ['REPORT STATUS', report.isReported ? 'Final' : 'Draft'],
  ]);
  addInfoRow([
    ['SIGNED DATE & TIME', formatDateTime(report.reportSignedAt)],
    ['ELECTRONIC SIGNATURE', report.isReported ? 'Signed electronically' : 'Not signed'],
  ]);

  if (!report.isReported) {
    const pageCount = pdf.getNumberOfPages();
    for (let page = 1; page <= pageCount; page++) {
      pdf.setPage(page);
      pdf.setTextColor(245, 158, 11);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(42);
      pdf.text('DRAFT', PAGE_WIDTH / 2, PAGE_HEIGHT / 2, { align: 'center', angle: 35 });
    }
  }

  const pageCount = pdf.getNumberOfPages();
  for (let page = 1; page <= pageCount; page++) {
    pdf.setPage(page);
    pdf.setDrawColor(213, 222, 229);
    pdf.line(MARGIN_X, PAGE_HEIGHT - 17, PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - 17);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.8);
    pdf.setTextColor(...MUTED);
    pdf.text(
      'This report supports clinical documentation and does not replace professional judgment, local policy, or approved reporting standards.',
      MARGIN_X,
      PAGE_HEIGHT - 12,
      { maxWidth: CONTENT_WIDTH - 20 }
    );
    pdf.text(`Page ${page} of ${pageCount}`, PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - 12, {
      align: 'right',
    });
  }

  return pdf;
}

export function getStudyReportPdfFilename(context: StudyReportPdfContext): string {
  return `Radiology_Report_${fileSafe(context.patientId)}_${fileSafe(context.studyDateTime)}.pdf`;
}
