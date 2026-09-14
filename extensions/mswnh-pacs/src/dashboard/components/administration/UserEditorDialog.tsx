import React, { useEffect, useState } from 'react';
import { Button, Input } from '@ohif/ui-next';

import { useDialogAccessibility } from '../../hooks/useDialogAccessibility';
import type { CreatePacsUser, PacsRole, PacsUser, UpdatePacsUser } from '../../models';

export function UserEditorDialog({
  open,
  user,
  roles,
  busy,
  onLoadSignature,
  onSave,
  onClose,
}: {
  open: boolean;
  user: PacsUser | null;
  roles: PacsRole[];
  busy: boolean;
  onLoadSignature: (userId: string) => Promise<Blob | null>;
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
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [removeSignature, setRemoveSignature] = useState(false);
  const [signatureError, setSignatureError] = useState<string | null>(null);
  const [signatureLoading, setSignatureLoading] = useState(false);
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

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    setSignatureFile(null);
    setSignaturePreview(null);
    setRemoveSignature(false);
    setSignatureError(null);
    setSignatureLoading(false);
    if (!open || !user || !user.roles.includes('RADIOLOGIST')) return undefined;
    setSignatureLoading(true);
    void onLoadSignature(user.id)
      .then(blob => {
        if (!blob || cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSignaturePreview(objectUrl);
      })
      .catch(reason => {
        if (!cancelled) {
          setSignatureError(
            reason instanceof Error ? reason.message : 'The existing signature could not be loaded.'
          );
        }
      })
      .finally(() => !cancelled && setSignatureLoading(false));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [onLoadSignature, open, user]);

  useEffect(
    () => () => {
      if (signaturePreview?.startsWith('blob:')) URL.revokeObjectURL(signaturePreview);
    },
    [signaturePreview]
  );

  if (!open) return null;
  const editing = Boolean(user);
  const isRadiologist = selectedRoles.includes('RADIOLOGIST');
  const valid =
    username.trim().length >= 3 &&
    selectedRoles.length > 0 &&
    (editing || password.length >= 6) &&
    !signatureError &&
    !signatureLoading;

  const selectSignature = async (file: File | undefined) => {
    if (!file) return;
    setSignatureError(null);
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setSignatureError('Upload a PNG, JPG or JPEG image.');
      return;
    }
    if (file.size > 1024 * 1024) {
      setSignatureError('The signature image must be no larger than 1 MB.');
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      const fits =
        Math.min(bitmap.width, bitmap.height) <= 200 &&
        Math.max(bitmap.width, bitmap.height) <= 400;
      bitmap.close();
      if (!fits) {
        setSignatureError('The signature image must fit within 200 x 400 pixels.');
        return;
      }
      if (signaturePreview?.startsWith('blob:')) URL.revokeObjectURL(signaturePreview);
      setSignatureFile(file);
      setSignaturePreview(URL.createObjectURL(file));
      setRemoveSignature(false);
    } catch {
      setSignatureError('The selected file is not a valid signature image.');
    }
  };

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
            signatureFile: isRadiologist ? signatureFile : null,
            removeSignature: isRadiologist ? removeSignature : false,
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

        {isRadiologist && (
          <fieldset className="border-input/60 mt-5 rounded-lg border p-4">
            <legend className="text-foreground px-1 text-sm font-semibold">
              Scanned signature
            </legend>
            <p className="text-muted-foreground mt-1 text-xs">
              Optional during account setup; required when this Radiologist uses Save &amp; sign.
              PNG, JPG or JPEG, maximum 1 MB and 200 x 400 pixels.
            </p>
            {signaturePreview && !removeSignature && (
              <div className="border-input min-h-24 min-w-48 mt-3 inline-flex items-center justify-center rounded-lg border bg-white p-3">
                <img
                  src={signaturePreview}
                  alt="Scanned signature preview"
                  className="max-h-[200px] max-w-[400px] object-contain"
                />
              </div>
            )}
            {signatureLoading && (
              <p className="text-muted-foreground mt-3 text-sm">Loading existing signature...</p>
            )}
            {signatureError && (
              <p
                className="text-destructive mt-3 text-sm"
                role="alert"
              >
                {signatureError}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label className="border-input text-foreground hover:bg-muted cursor-pointer rounded-md border px-3 py-2 text-sm">
                {signaturePreview ? 'Replace signature' : 'Upload signature'}
                <input
                  type="file"
                  className="sr-only"
                  accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                  disabled={busy || signatureLoading}
                  onChange={event => void selectSignature(event.target.files?.[0])}
                />
              </label>
              {signaturePreview && (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => {
                    if (signaturePreview.startsWith('blob:')) URL.revokeObjectURL(signaturePreview);
                    setSignaturePreview(null);
                    setSignatureFile(null);
                    setRemoveSignature(true);
                    setSignatureError(null);
                  }}
                >
                  Remove signature
                </Button>
              )}
            </div>
          </fieldset>
        )}

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
