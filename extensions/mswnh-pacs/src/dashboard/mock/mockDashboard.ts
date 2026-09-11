import type { DashboardAlert, ModalityActivity } from '../models';

const minutesAgo = (now: Date, minutes: number) =>
  new Date(now.getTime() - minutes * 60_000).toISOString();

export function createMockAlerts(now = new Date()): DashboardAlert[] {
  return [
    {
      id: 'alert-1',
      severity: 'CRITICAL',
      title: 'Emergency CT outside opening target',
      message: 'CT Pulmonary Angiogram has not been opened within 30 minutes.',
      occurredAt: minutesAgo(now, 8),
      acknowledged: false,
      studyId: 'study-1',
    },
    {
      id: 'alert-2',
      severity: 'WARNING',
      title: 'Incomplete ultrasound transmission',
      message: 'Breast Ultrasound transmission is missing expected cine clips.',
      occurredAt: minutesAgo(now, 31),
      acknowledged: false,
      studyId: 'study-6',
    },
    {
      id: 'alert-3',
      severity: 'WARNING',
      title: 'Missing accession number',
      message: 'Renal Ultrasound was received without an accession number.',
      occurredAt: minutesAgo(now, 54),
      acknowledged: false,
      studyId: 'study-8',
    },
    {
      id: 'alert-4',
      severity: 'WARNING',
      title: 'Report overdue',
      message: 'CT Abdomen and Pelvis is 42 minutes beyond its reporting target.',
      occurredAt: minutesAgo(now, 42),
      acknowledged: false,
      studyId: 'study-5',
    },
    {
      id: 'alert-5',
      severity: 'WARNING',
      title: 'Ultrasound modality not recently seen',
      message: 'The ultrasound modality is currently marked offline.',
      occurredAt: minutesAgo(now, 23),
      acknowledged: false,
      componentId: 'ultrasound',
    },
    {
      id: 'alert-6',
      severity: 'INFO',
      title: 'Backup verification pending',
      message: 'The latest backup completed but has not yet passed verification.',
      occurredAt: minutesAgo(now, 77),
      acknowledged: true,
      componentId: 'backup',
    },
  ];
}

export function createMockModalityActivity(now = new Date()): ModalityActivity[] {
  return [
    {
      modality: 'CT',
      label: 'CT',
      studiesToday: 31,
      state: 'RECENT',
      lastStudyReceivedAt: minutesAgo(now, 14),
    },
    {
      modality: 'US',
      label: 'Ultrasound',
      studiesToday: 54,
      state: 'IDLE',
      lastStudyReceivedAt: minutesAgo(now, 248),
    },
    {
      modality: 'DR',
      label: 'CR/DR',
      studiesToday: 37,
      state: 'RECENT',
      lastStudyReceivedAt: minutesAgo(now, 21),
    },
    {
      modality: 'MR',
      label: 'MRI',
      studiesToday: 6,
      state: 'IDLE',
      lastStudyReceivedAt: minutesAgo(now, 185),
    },
  ];
}
