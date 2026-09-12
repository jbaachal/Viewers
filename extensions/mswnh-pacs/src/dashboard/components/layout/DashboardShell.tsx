import React, { useEffect, useState } from 'react';

import { useDashboardContext } from '../../context/DashboardProvider';
import { DashboardHeader } from './DashboardHeader';
import { DashboardSidebar } from './DashboardSidebar';
import { TabletNavigation } from './TabletNavigation';
import '../../dashboard.css';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem('mswnh-dashboard-sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const { initializationError } = useDashboardContext();

  useEffect(() => {
    try {
      window.localStorage.setItem('mswnh-dashboard-sidebar-collapsed', String(sidebarCollapsed));
    } catch {
      // The sidebar still works when browser storage is unavailable.
    }
  }, [sidebarCollapsed]);

  return (
    <div className="mswnh-dashboard bg-background text-foreground flex h-screen min-h-0 flex-col overflow-hidden">
      <a
        href="#dashboard-main-content"
        className="mswnh-dashboard-skip-link bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-semibold shadow-lg"
      >
        Skip to main content
      </a>
      <DashboardHeader
        onOpenNavigation={() => setNavigationOpen(true)}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(collapsed => !collapsed)}
      />
      <div className="flex min-h-0 flex-1">
        {!sidebarCollapsed && <DashboardSidebar />}
        <main
          id="dashboard-main-content"
          tabIndex={-1}
          className="min-w-0 flex-1 overflow-y-auto"
        >
          {initializationError ? (
            <div className="mx-auto flex min-h-full max-w-2xl items-center justify-center p-6">
              <div
                role="alert"
                className="border-destructive/50 bg-destructive/10 rounded-lg border p-6"
              >
                <h1 className="text-lg font-semibold">Dashboard data is unavailable</h1>
                <p className="text-muted-foreground mt-2">{initializationError.message}</p>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
      <TabletNavigation
        open={navigationOpen}
        onClose={() => setNavigationOpen(false)}
      />
    </div>
  );
}
