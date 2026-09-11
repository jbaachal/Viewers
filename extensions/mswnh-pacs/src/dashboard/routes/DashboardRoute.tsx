import React from 'react';

import { DashboardProvider } from '../context/DashboardProvider';
import { DashboardShell } from '../components/layout';
import type { DashboardPageId } from '../pages/DashboardStagePlaceholder';
import { OperationalDashboard } from '../pages/OperationalDashboard';
import { RadiologistWorklist } from '../pages/RadiologistWorklist';
import { ManagementDashboard } from '../pages/ManagementDashboard';
import { SystemMonitoring } from '../pages/SystemMonitoring';

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
      </DashboardShell>
    </DashboardProvider>
  );
}
