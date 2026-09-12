import React, { useEffect, useState } from 'react';
import { Button, Input } from '@ohif/ui-next';

import { useDialogAccessibility } from '../../hooks/useDialogAccessibility';
import type { PacsUser } from '../../models';

export function PasswordResetDialog({
  user,
  busy,
  onReset,
  onClose,
}: {
  user: PacsUser | null;
  busy: boolean;
  onReset: (password: string, temporary: boolean) => Promise<void>;
  onClose: () => void;
}) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [temporary, setTemporary] = useState(true);
  const open = Boolean(user);
  const { dialogRef, onKeyDown } = useDialogAccessibility<HTMLFormElement>(open, onClose);

  useEffect(() => {
    if (!open) return;
    setPassword('');
    setConfirmPassword('');
    setTemporary(true);
  }, [open, user?.id]);

  if (!user) return null;
  const valid = password.length >= 12 && password === confirmPassword;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[120] grid place-items-center bg-black/70 p-4"
      onMouseDown={event => event.target === event.currentTarget && onClose()}
    >
      <form
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="password-reset-title"
        tabIndex={-1}
        onKeyDown={onKeyDown}
        onSubmit={event => {
          event.preventDefault();
          if (valid) void onReset(password, temporary);
        }}
        className="border-input bg-background w-full max-w-md rounded-xl border p-5 shadow-2xl"
      >
        <h2
          id="password-reset-title"
          className="text-foreground text-lg font-semibold"
        >
          Reset password
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Set a new password for <strong className="text-foreground">{user.username}</strong>.
        </p>
        <div className="mt-5 space-y-4">
          <label className="text-foreground grid gap-1.5 text-sm">
            New password
            <Input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              minLength={12}
              required
              disabled={busy}
              autoComplete="new-password"
            />
          </label>
          <label className="text-foreground grid gap-1.5 text-sm">
            Confirm password
            <Input
              type="password"
              value={confirmPassword}
              onChange={event => setConfirmPassword(event.target.value)}
              minLength={12}
              required
              disabled={busy}
              autoComplete="new-password"
            />
          </label>
          {confirmPassword && password !== confirmPassword && (
            <p
              role="alert"
              className="text-xs text-red-300"
            >
              Passwords do not match.
            </p>
          )}
          <label className="text-foreground flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={temporary}
              disabled={busy}
              onChange={event => setTemporary(event.target.checked)}
            />
            Require password change at next login
          </label>
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
            {busy ? 'Resetting…' : 'Reset password'}
          </Button>
        </div>
      </form>
    </div>
  );
}
