import React from 'react';

import { DashboardProvider } from '../context/DashboardProvider';
import { DashboardShell } from '../components/layout';
import type { DashboardPageId } from '../pages/DashboardStagePlaceholder';
import { OperationalDashboard } from '../pages/OperationalDashboard';
import { RadiologistWorklist } from '../pages/RadiologistWorklist';
import { ManagementDashboard } from '../pages/ManagementDashboard';
import { SystemMonitoring } from '../pages/SystemMonitoring';
import { UserAdministration } from '../pages/UserAdministration';
import { SlaAdministration } from '../pages/SlaAdministration';
import { AuditLog } from '../pages/AuditLog';

export function DashboardRoute({
  page,
  servicesManager,
}: {
  page: DashboardPageId;
  servicesManager?: any;
}) {
  return (
    <DashboardProvider servicesManager={servicesManager}>
      <DashboardShell>
        {page === 'dashboard' && <OperationalDashboard />}
        {page === 'worklist' && <RadiologistWorklist />}
        {page === 'management' && <ManagementDashboard />}
        {page === 'system' && <SystemMonitoring />}
        {page === 'administration' && <UserAdministration />}
        {page === 'sla' && <SlaAdministration />}
        {page === 'audit' && <AuditLog />}
      </DashboardShell>
    </DashboardProvider>
  );
}
