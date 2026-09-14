import React from 'react';
import { Icons } from '@ohif/ui-next';

const pageCopy = {
  dashboard: {
    title: 'Operational Dashboard',
    description:
      'Operational metrics, priority worklist, workflow ageing, modality activity, alerts, and recent activity will be assembled in Stage 4.',
    icon: 'LayoutCommon2x2',
  },
  worklist: {
    title: 'Radiologist Worklist',
    description:
      'Worklist filters, local study actions, and study details will be assembled in Stage 5.',
    icon: 'PatientStudyList',
  },
  management: {
    title: 'Management Reports',
    description:
      'Volume, turnaround-time, SLA, productivity, and exception analytics will be assembled in Stage 6.',
    icon: 'SortingAscending',
  },
  system: {
    title: 'System Monitoring',
    description:
      'Archive, viewer, interface, modality, backup, and storage health views will be assembled in Stage 7.',
    icon: 'CloudSettings',
  },
  administration: {
    title: 'User Management',
    description: 'PACS account and role administration.',
    icon: 'Settings',
  },
  sla: {
    title: 'SLA Configuration',
    description: 'Reporting targets and warning thresholds.',
    icon: 'SortingAscending',
  },
  audit: {
    title: 'Audit Log',
    description: 'PACS workflow, clinical record, administration, and security activity.',
    icon: 'ListView',
  },
  devices: {
    title: 'Device Inventory',
    description: 'Automatically observed DICOM devices and their AE title endpoints.',
    icon: 'PatientStudyList',
  },
  'device-catalog': {
    title: 'Device Dropdown Lists',
    description: 'Managed modality, department and manufacturer values.',
    icon: 'ListView',
  },
} as const;

export type DashboardPageId = keyof typeof pageCopy;

export function DashboardStagePlaceholder({ page }: { page: DashboardPageId }) {
  const content = pageCopy[page];
  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">{content.title}</h1>
        </div>
        <span className="border-primary/30 bg-primary/10 text-primary rounded-full border px-3 py-1 text-xs font-medium">
          Demonstration data
        </span>
      </div>
      <section className="border-input/60 bg-card flex min-h-[420px] flex-col items-center justify-center rounded-xl border p-8 text-center shadow-sm">
        <div className="bg-primary/10 text-primary mb-5 flex h-14 w-14 items-center justify-center rounded-xl">
          <Icons.ByName
            name={content.icon}
            className="h-7 w-7"
          />
        </div>
        <h2 className="text-foreground text-lg font-semibold">Shared dashboard shell ready</h2>
        <p className="text-muted-foreground mt-2 max-w-xl text-base leading-6">
          {content.description}
        </p>
      </section>
    </div>
  );
}
