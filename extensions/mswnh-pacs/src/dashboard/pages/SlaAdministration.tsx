import React, { useCallback, useEffect, useState } from 'react';
import { Button, Input } from '@ohif/ui-next';

import { DashboardLoadingSkeleton } from '../components/dashboard';
import { ConfirmationDialog } from '../components/worklist';
import { useDashboardContext } from '../context/DashboardProvider';
import type { SlaSettings, UpdateSlaSettings } from '../models';

const fields = [
  {
    key: 'emergencyMinutes',
    label: 'Emergency target',
    description: 'Maximum reporting time for emergency studies.',
    max: 1440,
  },
  {
    key: 'urgentMinutes',
    label: 'Urgent target',
    description: 'Maximum reporting time for urgent studies.',
    max: 10080,
  },
  {
    key: 'routineMinutes',
    label: 'Routine target',
    description: 'Maximum reporting time for routine studies.',
    max: 43200,
  },
  {
    key: 'warningBeforeDueMinutes',
    label: 'Warning lead time',
    description: 'How early an approaching SLA deadline generates a warning.',
    max: 1440,
  },
] as const;

function readableDuration(minutes: number): string {
  if (minutes % 1440 === 0) return `${minutes / 1440} day${minutes === 1440 ? '' : 's'}`;
  if (minutes % 60 === 0) return `${minutes / 60} hour${minutes === 60 ? '' : 's'}`;
  return `${minutes} minutes`;
}

export function SlaAdministration() {
  const { services, demoRole } = useDashboardContext();
  const [settings, setSettings] = useState<SlaSettings | null>(null);
  const [draft, setDraft] = useState<SlaSettings | null>(null);
  const [applyToActiveStudies, setApplyToActiveStudies] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const allowed = demoRole === 'PACS_ADMIN';

  const load = useCallback(async () => {
    if (!services || !allowed) return;
    setLoading(true);
    try {
      const result = await services.slaAdministration.getSettings();
      setSettings(result);
      setDraft(result);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'SLA settings could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [allowed, services]);

  useEffect(() => {
    void load();
  }, [load]);

  const valid =
    draft !== null &&
    fields.every(field => draft[field.key] >= 1 && draft[field.key] <= field.max) &&
    draft.emergencyMinutes <= draft.urgentMinutes &&
    draft.urgentMinutes <= draft.routineMinutes;

  const save = async () => {
    if (!services || !draft || !valid) return;
    setConfirmOpen(false);
    setSaving(true);
    setError(null);
    try {
      const input: UpdateSlaSettings = {
        emergencyMinutes: draft.emergencyMinutes,
        urgentMinutes: draft.urgentMinutes,
        routineMinutes: draft.routineMinutes,
        warningBeforeDueMinutes: draft.warningBeforeDueMinutes,
        version: draft.version,
        applyToActiveStudies,
      };
      const result = await services.slaAdministration.updateSettings(input);
      setSettings(result);
      setDraft(result);
      setNotice(
        applyToActiveStudies
          ? `SLA settings saved. ${result.activeStudiesRecalculated ?? 0} active study deadlines were recalculated.`
          : 'SLA settings saved. Existing study deadlines were preserved.'
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'SLA settings could not be saved.');
    } finally {
      setSaving(false);
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
            SLA configuration is restricted to authorised PACS administrators.
          </p>
        </section>
      </div>
    );
  }

  if (loading && !draft) return <DashboardLoadingSkeleton label="Loading SLA settings" />;

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-3 sm:p-4 md:p-6">
      <header>
        <h1 className="text-foreground text-2xl font-semibold">SLA Configuration</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Configure reporting targets and advance-warning thresholds.
        </p>
      </header>

      {notice && (
        <div
          role="status"
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
            Reload settings
          </Button>
        </div>
      )}

      {draft && (
        <form
          className="space-y-5"
          onSubmit={event => {
            event.preventDefault();
            if (valid) setConfirmOpen(true);
          }}
        >
          <section className="border-input/60 bg-card rounded-xl border p-5 shadow-sm">
            <h2 className="text-foreground text-lg font-semibold">Reporting targets</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {fields.map(field => (
                <label
                  key={field.key}
                  className="border-input/50 bg-background/40 grid gap-2 rounded-lg border p-4"
                >
                  <span className="text-foreground font-medium">{field.label}</span>
                  <span className="text-muted-foreground text-xs">{field.description}</span>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min={1}
                      max={field.max}
                      required
                      disabled={saving}
                      value={draft[field.key]}
                      onChange={event =>
                        setDraft(current =>
                          current
                            ? { ...current, [field.key]: Number(event.target.value) }
                            : current
                        )
                      }
                    />
                    <span className="text-muted-foreground text-sm">minutes</span>
                  </div>
                  <span className="text-primary text-xs">{readableDuration(draft[field.key])}</span>
                </label>
              ))}
            </div>
            {!valid && (
              <p className="mt-4 text-sm text-amber-300">
                Emergency must not exceed Urgent, and Urgent must not exceed Routine. All values
                must remain within the displayed limits.
              </p>
            )}
          </section>

          <section className="border-input/60 bg-card rounded-xl border p-5 shadow-sm">
            <h2 className="text-foreground text-lg font-semibold">Applying changes</h2>
            <label className="text-foreground mt-4 flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={applyToActiveStudies}
                disabled={saving}
                onChange={event => setApplyToActiveStudies(event.target.checked)}
              />
              <span>
                <span className="block font-medium">Recalculate active study deadlines</span>
                <span className="text-muted-foreground mt-1 block text-xs leading-5">
                  Rebase Received, Assigned, and In Review studies from their original
                  archive-received time. Completed and historical studies are never changed.
                </span>
              </span>
            </label>
            {settings?.updatedAt && (
              <p className="text-muted-foreground mt-4 text-xs">
                Last updated {new Date(settings.updatedAt).toLocaleString()} by{' '}
                {settings.updatedBy || 'an administrator'}.
              </p>
            )}
          </section>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={saving}
              onClick={() => {
                setDraft(settings);
                setApplyToActiveStudies(true);
              }}
            >
              Discard changes
            </Button>
            <Button
              type="submit"
              disabled={saving || !valid}
            >
              {saving ? 'Saving…' : 'Save SLA settings'}
            </Button>
          </div>
        </form>
      )}

      <ConfirmationDialog
        open={confirmOpen}
        title="Apply SLA configuration?"
        description={
          applyToActiveStudies
            ? 'The new targets will immediately recalculate deadlines for every active study. This change is audited.'
            : 'The new targets will apply to future studies and later priority changes. Existing deadlines will remain unchanged.'
        }
        confirmLabel="Apply settings"
        onConfirm={() => void save()}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}
