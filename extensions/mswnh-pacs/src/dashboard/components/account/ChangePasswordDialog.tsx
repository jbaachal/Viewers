import React, { useEffect, useState } from 'react';
import { Button, Input } from '@ohif/ui-next';

import { useDialogAccessibility } from '../../hooks/useDialogAccessibility';

export function ChangePasswordDialog({
  open,
  busy,
  error,
  onChangePassword,
  onClose,
}: {
  open: boolean;
  busy: boolean;
  error: string | null;
  onChangePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  onClose: () => void;
}) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { dialogRef, onKeyDown } = useDialogAccessibility<HTMLFormElement>(open, onClose);

  useEffect(() => {
    if (!open) return;
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }, [open]);

  if (!open) return null;

  const matches = newPassword === confirmPassword;
  const valid = oldPassword.length > 0 && newPassword.length >= 6 && matches;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[120] grid place-items-center bg-black/70 p-4"
      onMouseDown={event => event.target === event.currentTarget && !busy && onClose()}
    >
      <form
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        tabIndex={-1}
        onKeyDown={onKeyDown}
        onSubmit={event => {
          event.preventDefault();
          if (valid) void onChangePassword(oldPassword, newPassword);
        }}
        className="border-input bg-background w-full max-w-md rounded-xl border p-5 shadow-2xl"
      >
        <h2
          id="change-password-title"
          className="text-foreground text-lg font-semibold"
        >
          Change Password
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Choose a password with at least 6 characters. You will be signed out after it is changed.
        </p>

        <div className="mt-5 space-y-4">
          <label className="text-foreground grid gap-1.5 text-sm">
            Old password
            <Input
              type="password"
              value={oldPassword}
              onChange={event => setOldPassword(event.target.value)}
              required
              disabled={busy}
              autoComplete="current-password"
              autoFocus
            />
          </label>
          <label className="text-foreground grid gap-1.5 text-sm">
            New password
            <Input
              type="password"
              value={newPassword}
              onChange={event => setNewPassword(event.target.value)}
              minLength={6}
              required
              disabled={busy}
              autoComplete="new-password"
            />
          </label>
          <label className="text-foreground grid gap-1.5 text-sm">
            Confirm new password
            <Input
              type="password"
              value={confirmPassword}
              onChange={event => setConfirmPassword(event.target.value)}
              minLength={6}
              required
              disabled={busy}
              autoComplete="new-password"
            />
          </label>

          {newPassword && newPassword.length < 6 && (
            <p className="text-xs text-amber-300">Use at least 6 characters.</p>
          )}
          {confirmPassword && !matches && (
            <p
              role="alert"
              className="text-xs text-red-300"
            >
              Passwords do not match.
            </p>
          )}
          {error && (
            <p
              role="alert"
              className="bg-red-950/40 rounded-md border border-red-500/40 p-3 text-sm text-red-200"
            >
              {error}
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={busy || !valid}
          >
            {busy ? 'Changing…' : 'Change Password'}
          </Button>
        </div>
      </form>
    </div>
  );
}
