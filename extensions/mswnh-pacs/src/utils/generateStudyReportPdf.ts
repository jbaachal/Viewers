import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

import type { StudyReport } from '../services/StudyReportsService';
import { createReportQrPayload } from './reportQrPayload';

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
const MARGIN_X = 10;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const FOOTER_TOP = 282;
const SECTION_GAP = 2;
const ICON_WIDTH = 13;
const CHARCOAL = [31, 31, 31] as const;
const BLACK = [10, 10, 10] as const;
const HEADER_PANEL = [241, 241, 241] as const;
const BORDER = [176, 181, 187] as const;
const TEXT = [22, 22, 22] as const;
const MUTED = [88, 94, 103] as const;

function safeText(value: string | undefined | null): string {
  return value?.trim() || 'Not available';
}

function fileSafe(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || 'patient';
}

function formatDateTime(value: string | undefined): string {
  if (!value) return 'Not signed';
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
    if (!response.ok) return null;
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
      const canvasContext = canvas.getContext('2d');
      if (!canvasContext) return null;
      canvasContext.drawImage(image, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/png');
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  } catch {
    return null;
  }
}

function drawIcon(pdf: jsPDF, icon: string, x: number, y: number, height: number) {
  const centerX = x + ICON_WIDTH / 2;
  const centerY = y + height / 2;
  pdf.setDrawColor(255, 255, 255);
  pdf.setFillColor(255, 255, 255);
  pdf.setLineWidth(0.55);

  if (icon === 'patient' || icon === 'verify') {
    pdf.circle(centerX, centerY - 1.7, 1.45, 'F');
    pdf.roundedRect(centerX - 2.3, centerY + 0.2, 4.6, 2.7, 0.8, 0.8, 'F');
  } else if (icon === 'document' || icon === 'conclusion') {
    pdf.roundedRect(centerX - 2.1, centerY - 2.8, 4.2, 5.7, 0.4, 0.4, 'S');
    pdf.line(centerX - 1.2, centerY - 0.9, centerX + 1.2, centerY - 0.9);
    pdf.line(centerX - 1.2, centerY + 0.3, centerX + 1.2, centerY + 0.3);
    pdf.line(centerX - 1.2, centerY + 1.5, centerX + 0.5, centerY + 1.5);
  } else if (icon === 'comparison') {
    pdf.circle(centerX, centerY, 2.4, 'S');
    pdf.triangle(
      centerX + 1.3,
      centerY - 2.8,
      centerX + 3.1,
      centerY - 2.1,
      centerX + 2.2,
      centerY - 0.7,
      'F'
    );
  } else if (icon === 'findings') {
    pdf.roundedRect(centerX - 2.8, centerY + 0.6, 1.2, 2.2, 0.25, 0.25, 'F');
    pdf.roundedRect(centerX - 0.6, centerY - 1, 1.2, 3.8, 0.25, 0.25, 'F');
    pdf.roundedRect(centerX + 1.6, centerY - 2.7, 1.2, 5.5, 0.25, 0.25, 'F');
  } else if (icon === 'recommendation') {
    pdf.ellipse(centerX, centerY - 0.3, 3, 2.1, 'F');
    pdf.triangle(
      centerX - 1.5,
      centerY + 1,
      centerX - 2.4,
      centerY + 2.5,
      centerX - 0.3,
      centerY + 1.5,
      'F'
    );
  } else {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    pdf.text(icon === 'technique' ? 'T' : 'i', centerX, centerY + 2.1, { align: 'center' });
  }
}

export async function createStudyReportPdf(
  report: StudyReport,
  context: StudyReportPdfContext,
  signatureDataUrl?: string | null
): Promise<jsPDF> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  const logo = await loadHospitalLogo();
  const qrCode = await QRCode.toDataURL(
    createReportQrPayload(context.studyInstanceUid, report.id),
    { errorCorrectionLevel: 'M', margin: 1, width: 256 }
  );
  let y = 12;

  pdf.setProperties({
    title: `Radiology Report - ${safeText(context.patientName)}`,
    subject: report.subject,
    author: safeText(report.reportedByName || report.reportedBy),
    creator: 'MSWNH PACS',
    keywords: `radiology,${context.studyInstanceUid}`,
  });

  const addPageHeader = (continuation = false) => {
    if (continuation) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(...BLACK);
      pdf.text('RADIOLOGY REPORT - CONTINUED', MARGIN_X, 13);
      pdf.setDrawColor(...CHARCOAL);
      pdf.setLineWidth(0.7);
      pdf.line(MARGIN_X, 17, PAGE_WIDTH - MARGIN_X, 17);
      y = 22;
      return;
    }

    if (logo) pdf.addImage(logo, 'PNG', MARGIN_X + 2, 5, 28, 18.7, undefined, 'FAST');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(...BLACK);
    pdf.text('RADIOLOGY REPORT', 45, 12.5);
    pdf.setFontSize(8.5);
    pdf.text('Mulago Specialised Women and Neonatal Hospital', 45, 18.5);

    const boxX = 130;
    const boxY = 5;
    const boxWidth = 70;
    const boxHeight = 19;
    const qrSize = 17;
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(...BORDER);
    pdf.roundedRect(boxX, boxY, boxWidth, boxHeight, 1.2, 1.2, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.2);
    pdf.setTextColor(...MUTED);
    pdf.text('REPORT ID', boxX + 3, boxY + 5);
    pdf.text('STUDY UID', boxX + 3, boxY + 12.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...TEXT);
    pdf.text(report.id, boxX + 3, boxY + 8, { maxWidth: 44 });
    pdf.text(context.studyInstanceUid, boxX + 3, boxY + 15.5, { maxWidth: 44 });
    pdf.addImage(
      qrCode,
      'PNG',
      boxX + boxWidth - qrSize - 1,
      boxY + 1,
      qrSize,
      qrSize,
      undefined,
      'FAST'
    );

    pdf.setDrawColor(...CHARCOAL);
    pdf.setLineWidth(0.8);
    pdf.line(MARGIN_X, 28, PAGE_WIDTH - MARGIN_X, 28);
    y = 32;
  };

  const addNewPage = () => {
    pdf.addPage();
    addPageHeader(true);
  };

  const ensureSpace = (height: number) => {
    if (y + height > FOOTER_TOP - 3) addNewPage();
  };

  const drawFullBand = (title: string, icon: string) => {
    const height = 9;
    pdf.setFillColor(...CHARCOAL);
    pdf.roundedRect(MARGIN_X, y, CONTENT_WIDTH, height, 1.2, 1.2, 'F');
    drawIcon(pdf, icon, MARGIN_X, y, height);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(255, 255, 255);
    pdf.text(title, MARGIN_X + ICON_WIDTH + 1.5, y + 6.1);
    y += height;
  };

  const drawInfoGrid = (rows: Array<Array<[string, string]>>) => {
    const rowHeight = 11.5;
    const columnWidth = CONTENT_WIDTH / 2;
    const totalHeight = rows.length * rowHeight;
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(...BORDER);
    pdf.rect(MARGIN_X, y, CONTENT_WIDTH, totalHeight, 'FD');
    rows.forEach((row, rowIndex) => {
      const rowY = y + rowIndex * rowHeight;
      if (rowIndex) pdf.line(MARGIN_X, rowY, PAGE_WIDTH - MARGIN_X, rowY);
      pdf.line(MARGIN_X + columnWidth, rowY + 1, MARGIN_X + columnWidth, rowY + rowHeight - 1);
      row.forEach(([label, value], columnIndex) => {
        const x = MARGIN_X + columnIndex * columnWidth + 5;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(6.5);
        pdf.setTextColor(...TEXT);
        pdf.text(label, x, rowY + 3.6);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8.2);
        const lines = pdf.splitTextToSize(safeText(value), columnWidth - 9) as string[];
        pdf.text(lines.slice(0, 2), x, rowY + 7.5);
      });
    });
    y += totalHeight + SECTION_GAP;
  };

  const drawSectionHeader = (title: string, icon: string, note?: string) => {
    const height = 8.5;
    pdf.setFillColor(...HEADER_PANEL);
    pdf.setDrawColor(...BORDER);
    pdf.roundedRect(MARGIN_X, y, CONTENT_WIDTH, height, 1.1, 1.1, 'FD');
    pdf.setFillColor(...CHARCOAL);
    pdf.roundedRect(MARGIN_X, y, ICON_WIDTH, height, 1.1, 1.1, 'F');
    pdf.rect(MARGIN_X + ICON_WIDTH - 1.2, y, 1.2, height, 'F');
    drawIcon(pdf, icon, MARGIN_X, y, height);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.3);
    pdf.setTextColor(...TEXT);
    pdf.text(title, MARGIN_X + ICON_WIDTH + 3.5, y + 5.7);
    if (note) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.3);
      pdf.text(note, PAGE_WIDTH - MARGIN_X - 3, y + 5.5, { align: 'right' });
    }
    y += height;
  };

  const drawNarrative = (title: string, value: string, icon: string, note?: string) => {
    const allLines = pdf.splitTextToSize(safeText(value), CONTENT_WIDTH - 10) as string[];
    let lineIndex = 0;
    let continued = false;
    do {
      const titleText = continued ? `${title} - CONTINUED` : title;
      const minimumBodyHeight = 7.5;
      ensureSpace(8.5 + minimumBodyHeight + SECTION_GAP);
      const availableBodyHeight = FOOTER_TOP - y - 8.5 - SECTION_GAP;
      const linesPerPage = Math.max(1, Math.floor((availableBodyHeight - 3.2) / 3.8));
      const chunk = allLines.slice(lineIndex, lineIndex + linesPerPage);
      const bodyHeight = Math.max(minimumBodyHeight, chunk.length * 3.8 + 3.2);
      drawSectionHeader(titleText, icon, continued ? undefined : note);
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(...BORDER);
      pdf.rect(MARGIN_X, y, CONTENT_WIDTH, bodyHeight, 'FD');
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.8);
      pdf.setTextColor(...TEXT);
      pdf.text(chunk, MARGIN_X + 5, y + 4.5);
      y += bodyHeight + SECTION_GAP;
      lineIndex += chunk.length;
      continued = true;
      if (lineIndex < allLines.length) addNewPage();
    } while (lineIndex < allLines.length);
  };

  const drawVerification = () => {
    const firstRowHeight = 12;
    const secondRowHeight = 18;
    ensureSpace(9 + firstRowHeight + secondRowHeight + SECTION_GAP);
    drawFullBand('RADIOLOGIST VERIFICATION', 'verify');
    const startY = y;
    const columnWidth = CONTENT_WIDTH / 2;
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(...BORDER);
    pdf.rect(MARGIN_X, startY, CONTENT_WIDTH, firstRowHeight + secondRowHeight, 'FD');
    pdf.line(MARGIN_X, startY + firstRowHeight, PAGE_WIDTH - MARGIN_X, startY + firstRowHeight);
    pdf.line(
      MARGIN_X + columnWidth,
      startY + 1,
      MARGIN_X + columnWidth,
      startY + firstRowHeight + secondRowHeight - 1
    );

    const drawCell = (label: string, value: string, x: number, cellY: number) => {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.5);
      pdf.setTextColor(...TEXT);
      pdf.text(label, x + 5, cellY + 4);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.4);
      pdf.text(safeText(value), x + 5, cellY + 8.3, { maxWidth: columnWidth - 10 });
    };

    drawCell(
      'REPORTED BY',
      report.reportedByName || report.reportedBy || 'Not signed',
      MARGIN_X,
      startY
    );
    drawCell(
      'REPORT STATUS',
      report.isReported ? 'FINAL' : 'DRAFT',
      MARGIN_X + columnWidth,
      startY
    );
    drawCell(
      'SIGNED DATE & TIME',
      formatDateTime(report.reportSignedAt),
      MARGIN_X,
      startY + firstRowHeight
    );

    const signatureX = MARGIN_X + columnWidth;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    pdf.setTextColor(...TEXT);
    pdf.text('SIGNATURE', signatureX + 5, startY + firstRowHeight + 4);
    if (report.isReported && signatureDataUrl) {
      const imageFormat = signatureDataUrl.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
      const aspect =
        report.signatureWidth && report.signatureHeight
          ? report.signatureWidth / report.signatureHeight
          : 3;
      let imageWidth = Math.min(48, 11 * aspect);
      let imageHeight = imageWidth / aspect;
      if (imageHeight > 11) {
        imageHeight = 11;
        imageWidth = imageHeight * aspect;
      }
      pdf.addImage(
        signatureDataUrl,
        imageFormat,
        signatureX + 5,
        startY + firstRowHeight + 5,
        imageWidth,
        imageHeight,
        undefined,
        'FAST'
      );
    } else {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.4);
      pdf.text(
        report.isReported ? 'Signed electronically' : 'Not signed',
        signatureX + 5,
        startY + firstRowHeight + 9
      );
    }
    y += firstRowHeight + secondRowHeight + SECTION_GAP;
  };

  addPageHeader();
  ensureSpace(9 + 57.5 + SECTION_GAP);
  drawFullBand('PATIENT & STUDY INFORMATION', 'patient');
  drawInfoGrid([
    [
      ['PATIENT NAME', context.patientName],
      ['MEDICAL RECORD NO.', context.patientId],
    ],
    [
      ['DATE OF BIRTH / AGE', context.birthDateOrAge],
      ['SEX', context.sex],
    ],
    [
      ['MODALITY', context.modality],
      ['ACCESSION NO.', context.accessionNumber],
    ],
    [
      ['PRIORITY', context.priority],
      ['STUDY DATE & TIME', context.studyDateTime],
    ],
    [
      ['REFERRAL DATE & TIME', context.referralDateTime],
      ['REFERRING CLINICIAN', context.referringClinician],
    ],
  ]);

  drawNarrative('CLINICAL INFORMATION', context.history, 'document');
  drawNarrative('REPORT SUBJECT', report.subject, 'document');
  drawNarrative('COMPARISON', report.comparison, 'comparison');
  drawNarrative('TECHNIQUE', report.technique, 'technique');
  drawNarrative('FINDINGS', report.findings, 'findings');
  drawNarrative('IMPRESSION / CONCLUSION', report.conclusion, 'conclusion');
  drawNarrative(
    'RECOMMENDATION',
    report.recommendation || 'No recommendation provided.',
    'recommendation',
    'Complete only when clinically indicated'
  );
  drawVerification();

  if (!report.isReported) {
    const draftPageCount = pdf.getNumberOfPages();
    for (let page = 1; page <= draftPageCount; page++) {
      pdf.setPage(page);
      pdf.setTextColor(180, 180, 180);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(42);
      pdf.text('DRAFT', PAGE_WIDTH / 2, PAGE_HEIGHT / 2, { align: 'center', angle: 35 });
    }
  }

  const pageCount = pdf.getNumberOfPages();
  for (let page = 1; page <= pageCount; page++) {
    pdf.setPage(page);
    pdf.setDrawColor(...CHARCOAL);
    pdf.setLineWidth(0.55);
    pdf.line(MARGIN_X, FOOTER_TOP, PAGE_WIDTH - MARGIN_X, FOOTER_TOP);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(...MUTED);
    pdf.text(
      'This report supports clinical documentation and does not replace professional judgment, local policy, or approved reporting standards.',
      MARGIN_X,
      FOOTER_TOP + 5,
      { maxWidth: CONTENT_WIDTH - 23 }
    );
    pdf.text(`Page ${page} of ${pageCount}`, PAGE_WIDTH - MARGIN_X, FOOTER_TOP + 5, {
      align: 'right',
    });
  }

  return pdf;
}

export function getStudyReportPdfFilename(context: StudyReportPdfContext): string {
  return `Radiology_Report_${fileSafe(context.patientId)}_${fileSafe(context.studyDateTime)}.pdf`;
}
