import React from 'react';
import { Button, Icons, TooltipProvider } from '@ohif/ui-next';

import { useDashboardContext } from '../../context/DashboardProvider';
import { useDialogAccessibility } from '../../hooks/useDialogAccessibility';
import { NavigationItems } from './NavigationItems';

export function TabletNavigation({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { demoRole } = useDashboardContext();
  const { dialogRef, onKeyDown } = useDialogAccessibility<HTMLElement>(open, onClose);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close navigation"
        tabIndex={-1}
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      <aside
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="PACS navigation drawer"
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="bg-card border-input absolute inset-y-0 left-0 flex w-[min(88vw,320px)] flex-col border-r shadow-2xl"
      >
        <div className="border-input/50 flex h-16 items-center justify-between border-b px-4">
          <span className="text-foreground text-base font-semibold">Navigation</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close navigation"
            onClick={onClose}
          >
            <Icons.Close className="h-4 w-4" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <TooltipProvider delayDuration={250}>
            <NavigationItems
              role={demoRole}
              onNavigate={onClose}
            />
          </TooltipProvider>
        </div>
      </aside>
    </div>
  );
}
