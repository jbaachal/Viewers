export type NavigationItem = {
  id: string;
  label: string;
  to?: string;
  icon: string;
  roles?: Array<'RADIOLOGIST' | 'MANAGEMENT' | 'PACS_ADMIN' | 'READ_ONLY'>;
  disabled?: boolean;
  end?: boolean;
};

export const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', to: '/dashboard', icon: 'LayoutCommon2x2', end: true },
  { id: 'worklist', label: 'Radiologist Worklist', to: '/worklist', icon: 'PatientStudyList' },
  { id: 'assigned', label: 'My Assigned Studies', to: '/worklist?assigned=me', icon: 'Checked' },
  {
    id: 'emergency',
    label: 'Emergency Studies',
    to: '/worklist?priority=emergency',
    icon: 'status-alert',
  },
  { id: 'reporting', label: 'Reporting', to: '/worklist?status=reported', icon: 'Clipboard' },
  { id: 'patients', label: 'Patients', to: '/', icon: 'MultiplePatients' },
  {
    id: 'management',
    label: 'Management Reports',
    to: '/dashboard/management',
    icon: 'SortingAscending',
    roles: ['MANAGEMENT', 'PACS_ADMIN'],
  },
  {
    id: 'system',
    label: 'System Monitoring',
    to: '/dashboard/system',
    icon: 'CloudSettings',
    roles: ['PACS_ADMIN'],
  },
  { id: 'audit', label: 'Audit Log', icon: 'ListView', disabled: true, roles: ['PACS_ADMIN'] },
  {
    id: 'administration',
    label: 'Administration',
    icon: 'Settings',
    disabled: true,
    roles: ['PACS_ADMIN'],
  },
];
