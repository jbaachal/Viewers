import React, { useCallback, useEffect, useState } from 'react';
import { Button, Input } from '@ohif/ui-next';

import { DashboardLoadingSkeleton } from '../components/dashboard';
import { useDashboardContext } from '../context/DashboardProvider';
import type { AuditEvent, AuditLogQuery } from '../models';

const pageSize = 50;
const categories = ['', 'WORKFLOW', 'NOTE', 'REPORT', 'SLA', 'ADMINISTRATION', 'SECURITY'];

const titleCase = (value: string) =>
  value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, character => character.toUpperCase());

const dateTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value));

const asIsoTime = (value?: string) => (value ? new Date(value).toISOString() : undefined);

function OutcomeBadge({ event }: { event: AuditEvent }) {
  const failed = event.outcome !== 'SUCCESS';
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold ${
        failed
          ? 'border-red-400/40 bg-red-400/10 text-red-300'
          : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
      }`}
    >
      {titleCase(event.outcome)}
    </span>
  );
}

export function AuditLog() {
  const { services, demoRole } = useDashboardContext();
  const allowed = demoRole === 'PACS_ADMIN';
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [first, setFirst] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [filters, setFilters] = useState<AuditLogQuery>({});
  const [draft, setDraft] = useState<AuditLogQuery>({});

  const load = useCallback(async () => {
    if (!services || !allowed) return;
    setLoading(true);
    try {
      const result = await services.auditLog.getEvents({ ...filters, first, pageSize });
      setEvents(result.events);
      setTotal(result.total);
      setGeneratedAt(result.generatedAt);
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The audit log could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [allowed, filters, first, services]);

  useEffect(() => void load(), [load]);

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
            Audit records are restricted to authorised PACS administrators.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1800px] space-y-5 p-3 sm:p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">Audit Log</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Immutable workflow, clinical record, configuration, account and security activity.
            {generatedAt ? ` Updated ${dateTime(generatedAt)}.` : ''}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => void load()}
        >
          Refresh
        </Button>
      </div>

      <section className="border-input/60 bg-card rounded-xl border p-4 shadow-sm">
        <form
          role="search"
          className="grid gap-3 md:grid-cols-2 xl:grid-cols-7"
          onSubmit={event => {
            event.preventDefault();
            setFirst(0);
            setFilters({
              ...draft,
              from: asIsoTime(draft.from),
              to: asIsoTime(draft.to),
            });
          }}
        >
          <label className="xl:col-span-2">
            <span className="text-muted-foreground mb-1 block text-xs font-medium">Search</span>
            <Input
              type="search"
              value={draft.search || ''}
              onChange={event => setDraft(value => ({ ...value, search: event.target.value }))}
              placeholder="Action, study UID, account or actor"
            />
          </label>
          <label>
            <span className="text-muted-foreground mb-1 block text-xs font-medium">Category</span>
            <select
              value={draft.category || ''}
              onChange={event => setDraft(value => ({ ...value, category: event.target.value }))}
              className="border-input bg-background text-foreground h-10 w-full rounded-md border px-3 text-sm"
            >
              {categories.map(category => (
                <option
                  key={category || 'all'}
                  value={category}
                >
                  {category ? titleCase(category) : 'All categories'}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-muted-foreground mb-1 block text-xs font-medium">Actor</span>
            <Input
              value={draft.actor || ''}
              onChange={event => setDraft(value => ({ ...value, actor: event.target.value }))}
              placeholder="Name or user ID"
            />
          </label>
          <label>
            <span className="text-muted-foreground mb-1 block text-xs font-medium">Action</span>
            <Input
              value={draft.action || ''}
              onChange={event => setDraft(value => ({ ...value, action: event.target.value }))}
              placeholder="e.g. assigned"
            />
          </label>
          <label>
            <span className="text-muted-foreground mb-1 block text-xs font-medium">From</span>
            <Input
              type="datetime-local"
              value={draft.from || ''}
              onChange={event => setDraft(value => ({ ...value, from: event.target.value }))}
            />
          </label>
          <label>
            <span className="text-muted-foreground mb-1 block text-xs font-medium">To</span>
            <Input
              type="datetime-local"
              value={draft.to || ''}
              onChange={event => setDraft(value => ({ ...value, to: event.target.value }))}
            />
          </label>
          <div className="flex items-end gap-2 xl:col-span-7">
            <Button type="submit">Apply filters</Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setDraft({});
                setFilters({});
                setFirst(0);
              }}
            >
              Clear
            </Button>
          </div>
        </form>
      </section>

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

      {loading && !events.length ? (
        <DashboardLoadingSkeleton label="Loading audit records" />
      ) : (
        <section
          className="border-input/60 bg-card overflow-hidden rounded-xl border shadow-sm"
          aria-busy={loading}
        >
          <div
            className="mswnh-scroll-region overflow-x-auto"
            role="region"
            aria-label="Audit records. Scroll horizontally to see all columns."
            tabIndex={0}
          >
            <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
              <caption className="sr-only">PACS audit records</caption>
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
                <tr>
                  {[
                    'Date and time',
                    'Category',
                    'Action',
                    'Actor',
                    'Resource',
                    'Outcome',
                    'Summary and details',
                  ].map(label => (
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
                {events.map(event => (
                  <tr
                    key={event.id}
                    className="border-input/40 border-b align-top last:border-0"
                  >
                    <td className="text-muted-foreground whitespace-nowrap px-4 py-3">
                      {dateTime(event.occurredAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="border-primary/30 bg-primary/10 text-primary rounded-full border px-2 py-1 text-[11px] font-semibold">
                        {titleCase(event.category)}
                      </span>
                    </td>
                    <td className="text-foreground px-4 py-3 font-medium">
                      {titleCase(event.action)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-foreground block">
                        {event.actorName || event.actorId}
                      </span>
                      <span className="text-muted-foreground block text-xs">
                        {event.actorRole ? titleCase(event.actorRole) : event.actorId}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-foreground block">{event.resourceType}</span>
                      <span
                        className="text-muted-foreground block max-w-[220px] truncate text-xs"
                        title={event.resourceId || undefined}
                      >
                        {event.resourceId || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <OutcomeBadge event={event} />
                    </td>
                    <td className="max-w-lg px-4 py-3">
                      <span className="text-foreground">{event.summary}</span>
                      {(event.detail || event.sourceIp || event.correlationId) && (
                        <details className="mt-2">
                          <summary className="text-primary cursor-pointer text-xs">
                            Technical details
                          </summary>
                          <div className="text-muted-foreground mt-2 space-y-1 break-words text-xs">
                            {event.detail && <p>{event.detail}</p>}
                            {event.sourceIp && <p>Source IP: {event.sourceIp}</p>}
                            {event.correlationId && <p>Correlation ID: {event.correlationId}</p>}
                          </div>
                        </details>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!events.length && (
              <div className="text-muted-foreground p-10 text-center text-sm">
                No audit records match these filters.
              </div>
            )}
          </div>
          <div className="border-input/50 flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              {total
                ? `${first + 1}–${Math.min(first + pageSize, total)} of ${total}`
                : '0 records'}
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
    </div>
  );
}
