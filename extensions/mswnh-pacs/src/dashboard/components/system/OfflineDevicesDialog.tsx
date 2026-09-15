import React from 'react';
import { Button, Icons } from '@ohif/ui-next';

import { useDialogAccessibility } from '../../hooks/useDialogAccessibility';
import type { DicomDeviceHealth } from '../../models';
import { DeviceInventory } from './DeviceInventory';

export function OfflineDevicesDialog({
  open,
  devices,
  onClose,
}: {
  open: boolean;
  devices: DicomDeviceHealth[];
  onClose: () => void;
}) {
  const { dialogRef, onKeyDown } = useDialogAccessibility<HTMLElement>(open, onClose);
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
      role="presentation"
      onMouseDown={event => event.target === event.currentTarget && onClose()}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="offline-devices-title"
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="border-input bg-card max-h-[90vh] w-full max-w-7xl overflow-y-auto rounded-xl border shadow-2xl"
      >
        <div className="border-input/60 flex items-start justify-between gap-4 border-b p-5">
          <div>
            <h2
              id="offline-devices-title"
              className="text-foreground text-xl font-semibold"
            >
              Offline DICOM devices
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {devices.length} physical device{devices.length === 1 ? '' : 's'} requiring attention
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close offline device details"
            onClick={onClose}
          >
            <Icons.Close className="h-4 w-4" />
          </Button>
        </div>
        {devices.length ? (
          <DeviceInventory devices={devices} />
        ) : (
          <p className="text-muted-foreground p-8 text-center text-sm">
            No offline devices are present in the latest monitoring snapshot.
          </p>
        )}
      </section>
    </div>
  );
}
