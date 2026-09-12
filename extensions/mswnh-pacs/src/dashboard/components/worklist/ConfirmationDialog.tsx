import React from 'react';
import { Button } from '@ohif/ui-next';

import { useDialogAccessibility } from '../../hooks/useDialogAccessibility';

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { dialogRef, onKeyDown } = useDialogAccessibility<HTMLElement>(open, onClose);
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[130] grid place-items-center bg-black/70 p-4"
      role="presentation"
      onMouseDown={event => event.target === event.currentTarget && onClose()}
    >
      <section
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-action-title"
        aria-describedby="confirm-action-description"
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="border-input bg-background w-full max-w-md rounded-xl border p-5 shadow-2xl"
      >
        <h2
          id="confirm-action-title"
          className="text-foreground text-lg font-semibold"
        >
          {title}
        </h2>
        <p
          id="confirm-action-description"
          className="text-muted-foreground mt-2 text-sm leading-6"
        >
          {description}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
