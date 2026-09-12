import React, { useCallback, useEffect, useState } from 'react';
import { Button, Input } from '@ohif/ui-next';

import { PasswordResetDialog, UserEditorDialog } from '../components/administration';
import { DashboardLoadingSkeleton } from '../components/dashboard';
import { useDashboardContext } from '../context/DashboardProvider';
import type { CreatePacsUser, PacsRole, PacsUser, UpdatePacsUser } from '../models';

const pageSize = 25;

function roleLabel(roleName: string, roles: PacsRole[]) {
  return roles.find(role => role.name === roleName)?.displayName ?? roleName.replaceAll('_', ' ');
}

export function UserAdministration() {
  const { services, demoRole } = useDashboardContext();
  const [users, setUsers] = useState<PacsUser[]>([]);
  const [roles, setRoles] = useState<PacsRole[]>([]);
  const [total, setTotal] = useState(0);
  const [first, setFirst] = useState(0);
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<PacsUser | null>(null);
  const [passwordUser, setPasswordUser] = useState<PacsUser | null>(null);
  const allowed = demoRole === 'PACS_ADMIN';

  const load = useCallback(async () => {
    if (!services || !allowed) return;
    setLoading(true);
    try {
      const [userResult, roleResult] = await Promise.all([
        services.userAdministration.getUsers(search, first, pageSize),
        roles.length ? Promise.resolve(roles) : services.userAdministration.getRoles(),
      ]);
      setUsers(userResult.users);
      setTotal(userResult.total);
      setRoles(roleResult);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'PACS users could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [allowed, first, roles, search, services]);

  useEffect(() => {
    void load();
  }, [load]);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 4500);
  };

  const saveUser = async (input: CreatePacsUser | UpdatePacsUser) => {
    if (!services) return;
    setBusy(true);
    try {
      if (editingUser) {
        await services.userAdministration.updateUser(editingUser.id, input as UpdatePacsUser);
        showNotice('User account updated. Role changes apply after the user signs in again.');
      } else {
        await services.userAdministration.createUser(input as CreatePacsUser);
        showNotice('User account created.');
      }
      setEditorOpen(false);
      setEditingUser(null);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The user could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async (password: string, temporary: boolean) => {
    if (!services || !passwordUser) return;
    setBusy(true);
    try {
      await services.userAdministration.resetPassword(passwordUser.id, password, temporary);
      setPasswordUser(null);
      showNotice('Password reset successfully.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The password could not be reset.');
    } finally {
      setBusy(false);
    }
  };

  if (!allowed) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <section
          role="alert"
          className="border-destructive/40 bg-destructive/10 rounded-xl border p-8 text-center"
        >
          <h1 className="text-foreground text-xl font-semibold">
            PACS administrator access required
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            User management is restricted to authorised PACS administrators.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 p-3 sm:p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">User Management</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Create and manage PACS accounts and application roles.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setEditingUser(null);
            setEditorOpen(true);
          }}
        >
          Create user
        </Button>
      </div>

      <section className="border-input/60 bg-card rounded-xl border p-4 shadow-sm">
        <form
          role="search"
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={event => {
            event.preventDefault();
            setFirst(0);
            setSearch(searchDraft.trim());
          }}
        >
          <label
            htmlFor="user-search"
            className="sr-only"
          >
            Search users
          </label>
          <Input
            id="user-search"
            type="search"
            value={searchDraft}
            onChange={event => setSearchDraft(event.target.value)}
            placeholder="Search username, name or email"
            className="sm:max-w-md"
          />
          <Button
            type="submit"
            variant="outline"
          >
            Search
          </Button>
          {(search || searchDraft) && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSearchDraft('');
                setSearch('');
                setFirst(0);
              }}
            >
              Clear
            </Button>
          )}
        </form>
      </section>

      {notice && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-200"
        >
          {notice}
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="border-destructive/50 bg-destructive/10 rounded-lg border p-4"
        >
          <p className="text-foreground text-sm">{error}</p>
          <Button
            type="button"
            size="sm"
            className="mt-3"
            onClick={() => void load()}
          >
            Try again
          </Button>
        </div>
      )}

      {loading && !users.length ? (
        <DashboardLoadingSkeleton label="Loading PACS users" />
      ) : (
        <section
          className="border-input/60 bg-card overflow-hidden rounded-xl border shadow-sm"
          aria-busy={loading}
        >
          <div
            className="mswnh-scroll-region overflow-x-auto"
            role="region"
            aria-label="PACS users. Scroll horizontally to see all columns."
            tabIndex={0}
          >
            <table className="w-full min-w-[880px] border-collapse text-left text-sm">
              <caption className="sr-only">
                PACS user accounts and assigned application roles
              </caption>
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
                <tr>
                  {['User', 'Email', 'Roles', 'Status', 'Actions'].map(label => (
                    <th
                      key={label}
                      scope="col"
                      className="border-input/50 border-b px-4 py-3 font-semibold"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr
                    key={user.id}
                    className="border-input/40 border-b last:border-0"
                  >
                    <td className="px-4 py-3">
                      <span className="text-foreground block font-medium">
                        {[user.firstName, user.lastName].filter(Boolean).join(' ') || user.username}
                      </span>
                      <span className="text-muted-foreground mt-0.5 block text-xs">
                        {user.username}
                      </span>
                    </td>
                    <td className="text-muted-foreground px-4 py-3">
                      {user.email || 'Not supplied'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex max-w-xl flex-wrap gap-1.5">
                        {user.roles.length ? (
                          user.roles.map(role => (
                            <span
                              key={role}
                              className="border-primary/30 bg-primary/10 text-primary rounded-full border px-2 py-1 text-[11px] font-medium"
                            >
                              {roleLabel(role, roles)}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground">No PACS role</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full border px-2 py-1 text-xs font-semibold ${user.enabled ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-slate-400/30 bg-slate-400/10 text-slate-300'}`}
                      >
                        {user.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingUser(user);
                            setEditorOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setPasswordUser(user)}
                        >
                          Reset password
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!users.length && (
              <div className="text-muted-foreground p-10 text-center text-sm">
                No users match this search.
              </div>
            )}
          </div>
          <div className="border-input/50 flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              {total ? `${first + 1}–${Math.min(first + pageSize, total)} of ${total}` : '0 users'}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={first === 0 || loading}
                onClick={() => setFirst(value => Math.max(0, value - pageSize))}
              >
                Previous
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={first + pageSize >= total || loading}
                onClick={() => setFirst(value => value + pageSize)}
              >
                Next
              </Button>
            </div>
          </div>
        </section>
      )}

      <UserEditorDialog
        open={editorOpen}
        user={editingUser}
        roles={roles}
        busy={busy}
        onSave={saveUser}
        onClose={() => {
          if (!busy) {
            setEditorOpen(false);
            setEditingUser(null);
          }
        }}
      />
      <PasswordResetDialog
        user={passwordUser}
        busy={busy}
        onReset={resetPassword}
        onClose={() => {
          if (!busy) setPasswordUser(null);
        }}
      />
    </div>
  );
}
