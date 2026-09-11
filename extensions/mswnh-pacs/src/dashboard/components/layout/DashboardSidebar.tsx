import React from 'react';
import { TooltipProvider } from '@ohif/ui-next';

import { useDashboardContext } from '../../context/DashboardProvider';
import { NavigationItems } from './NavigationItems';

export function DashboardSidebar() {
  const { demoRole } = useDashboardContext();

  return (
    <aside
      id="dashboard-sidebar"
      aria-label="PACS side menu"
      className="border-input/50 bg-card hidden w-60 shrink-0 border-r lg:flex lg:flex-col"
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <TooltipProvider delayDuration={250}>
          <NavigationItems role={demoRole} />
        </TooltipProvider>
      </div>
      <div className="border-input/50 border-t p-4">
        <div className="text-muted-foreground text-xs">Workflow source</div>
        <div className="text-foreground mt-1 text-sm font-medium">Live PACS worklist</div>
      </div>
    </aside>
  );
}
