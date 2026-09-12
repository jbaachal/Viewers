import React, { useEffect, useState } from 'react';
import { Button, Input } from '@ohif/ui-next';

import { useDialogAccessibility } from '../../hooks/useDialogAccessibility';
import type { CreatePacsUser, PacsRole, PacsUser, UpdatePacsUser } from '../../models';

export function UserEditorDialog({
  open,
  user,
  roles,
  busy,
  onSave,
  onClose,
}: {
  open: boolean;
  user: PacsUser | null;
  roles: PacsRole[];
  busy: boolean;
  onSave: (input: CreatePacsUser | UpdatePacsUser) => Promise<void>;
  onClose: () => void;
}) {
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [password, setPassword] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState(true);
  const { dialogRef, onKeyDown } = useDialogAccessibility<HTMLFormElement>(open, onClose);

  useEffect(() => {
    if (!open) return;
    setUsername(user?.username ?? '');
    setFirstName(user?.firstName ?? '');
    setLastName(user?.lastName ?? '');
    setEmail(user?.email ?? '');
    setEnabled(user?.enabled ?? true);
    setSelectedRoles(user?.roles ?? []);
    setPassword('');
    setTemporaryPassword(true);
  }, [open, user]);

  if (!open) return null;
  const editing = Boolean(user);
  const valid =
    username.trim().length >= 3 && selectedRoles.length > 0 && (editing || password.length >= 6);

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[120] grid place-items-center bg-black/70 p-4"
      onMouseDown={event => event.target === event.currentTarget && onClose()}
    >
      <form
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-editor-title"
        tabIndex={-1}
        onKeyDown={onKeyDown}
        onSubmit={event => {
          event.preventDefault();
          if (!valid) return;
          const common = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            enabled,
            roles: selectedRoles,
          };
          void onSave(
            editing
              ? common
              : {
                  ...common,
                  username: username.trim(),
                  initialPassword: password,
                  temporaryPassword,
                }
          );
        }}
        className="border-input bg-background max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border p-5 shadow-2xl"
      >
        <h2
          id="user-editor-title"
          className="text-foreground text-xl font-semibold"
        >
          {editing ? 'Edit PACS user' : 'Create PACS user'}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {editing
            ? 'Update identity details, access status and PACS roles.'
            : 'Create an account in the PACS Keycloak realm.'}
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-foreground grid gap-1.5 text-sm sm:col-span-2">
            Username
            <Input
              value={username}
              onChange={event => setUsername(event.target.value)}
              disabled={editing || busy}
              required
              minLength={3}
              autoComplete="off"
            />
          </label>
          <label className="text-foreground grid gap-1.5 text-sm">
            First name
            <Input
              value={firstName}
              onChange={event => setFirstName(event.target.value)}
              disabled={busy}
            />
          </label>
          <label className="text-foreground grid gap-1.5 text-sm">
            Last name
            <Input
              value={lastName}
              onChange={event => setLastName(event.target.value)}
              disabled={busy}
            />
          </label>
          <label className="text-foreground grid gap-1.5 text-sm sm:col-span-2">
            Email address
            <Input
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              disabled={busy}
            />
          </label>
          {!editing && (
            <label className="text-foreground grid gap-1.5 text-sm sm:col-span-2">
              Initial password
              <Input
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                disabled={busy}
                required
                minLength={6}
                autoComplete="new-password"
              />
              <span className="text-muted-foreground text-xs">At least 6 characters.</span>
            </label>
          )}
        </div>

        <fieldset className="border-input/60 mt-5 rounded-lg border p-4">
          <legend className="text-foreground px-1 text-sm font-semibold">PACS roles</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {roles.map(role => (
              <label
                key={role.name}
                className="text-foreground flex items-start gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selectedRoles.includes(role.name)}
                  disabled={busy}
                  onChange={event =>
                    setSelectedRoles(current =>
                      event.target.checked
                        ? [...current, role.name]
                        : current.filter(value => value !== role.name)
                    )
                  }
                />
                <span>
                  <span className="block font-medium">{role.displayName}</span>
                  <span className="text-muted-foreground block text-xs">{role.description}</span>
                </span>
              </label>
            ))}
          </div>
          {!selectedRoles.length && (
            <p className="mt-3 text-xs text-amber-300">Select at least one role.</p>
          )}
        </fieldset>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="text-foreground flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={enabled}
              disabled={busy}
              onChange={event => setEnabled(event.target.checked)}
            />
            Account enabled
          </label>
          {!editing && (
            <label className="text-foreground flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={temporaryPassword}
                disabled={busy}
                onChange={event => setTemporaryPassword(event.target.checked)}
              />
              Require password change at first login
            </label>
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
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Create user'}
          </Button>
        </div>
      </form>
    </div>
  );
}
