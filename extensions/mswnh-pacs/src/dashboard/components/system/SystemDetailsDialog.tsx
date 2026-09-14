import React from 'react';
import { Button, Icons } from '@ohif/ui-next';

import type { StorageHealth, SystemHealthComponent } from '../../models';
import { useDialogAccessibility } from '../../hooks/useDialogAccessibility';
import { formatKampalaDateTime } from '../../utils/formatDashboardDate';
import { SystemStatusBadge } from './SystemStatusBadge';

export function SystemDetailsDialog({
  component,
  storage,
  onClose,
}: {
  component: SystemHealthComponent | null;
  storage?: StorageHealth | null;
  onClose: () => void;
}) {
  const { dialogRef, onKeyDown } = useDialogAccessibility<HTMLElement>(Boolean(component), onClose);
  if (!component) return null;
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
        aria-labelledby="system-component-title"
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={`border-input bg-card max-h-[90vh] w-full overflow-y-auto rounded-xl border p-5 shadow-2xl ${component.kind === 'DICOM_ASSOCIATIONS' || component.kind === 'STORAGE' ? 'max-w-6xl' : 'max-w-lg'}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">
              {component.kind.replaceAll('_', ' ')}
            </p>
            <h2
              id="system-component-title"
              className="text-foreground mt-1 text-xl font-semibold"
            >
              {component.name}
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close details"
            onClick={onClose}
          >
            <Icons.Close className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-4">
          <SystemStatusBadge state={component.state} />
        </div>
        <p className="text-foreground mt-4 text-sm leading-6">{component.message}</p>
        <dl className="border-input/60 mt-5 grid gap-4 rounded-lg border p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Last checked</dt>
            <dd className="text-foreground mt-1">
              {formatKampalaDateTime(component.lastCheckedAt)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Response time</dt>
            <dd className="text-foreground mt-1 tabular-nums">
              {component.responseTimeMs === null
                ? 'Not applicable'
                : `${component.responseTimeMs} ms`}
            </dd>
          </div>
          {component.lastStudyReceivedAt && (
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground">Last study received</dt>
              <dd className="text-foreground mt-1">
                {formatKampalaDateTime(component.lastStudyReceivedAt)}
              </dd>
            </div>
          )}
        </dl>
        {component.kind === 'DICOM_ASSOCIATIONS' && (
          <div className="mt-5">
            <h3 className="text-foreground text-sm font-semibold">Failed attempts</h3>
            {!component.failedAssociations?.length ? (
              <p className="text-muted-foreground mt-2 text-sm">No failed attempts were found.</p>
            ) : (
              <div className="mswnh-scroll-region border-input/60 mt-2 max-h-72 overflow-auto rounded-lg border">
                <table className="w-full min-w-[720px] border-collapse text-left text-xs">
                  <thead className="bg-muted sticky top-0">
                    <tr className="text-muted-foreground">
                      <th className="p-2">Time</th>
                      <th className="p-2">Failure</th>
                      <th className="p-2">Calling AE</th>
                      <th className="p-2">Called AE</th>
                      <th className="p-2">Source IP</th>
                      <th className="p-2">Association</th>
                    </tr>
                  </thead>
                  <tbody>
                    {component.failedAssociations.map((failure, index) => (
                      <tr
                        key={`${failure.occurredAt}-${failure.associationId ?? index}`}
                        className="border-input/50 border-t"
                      >
                        <td className="text-foreground whitespace-nowrap p-2">
                          {formatKampalaDateTime(failure.occurredAt)}
                        </td>
                        <td className="p-2">
                          <span className="text-red-400">{failure.failureType}</span>
                          <span className="text-muted-foreground max-w-72 mt-1 block break-words">
                            {failure.detail}
                          </span>
                        </td>
                        <td className="text-foreground p-2">
                          {failure.callingAeTitle ?? 'Unknown'}
                        </td>
                        <td className="text-foreground p-2">
                          {failure.calledAeTitle ?? 'Unknown'}
                        </td>
                        <td className="text-foreground p-2">{failure.sourceIp ?? 'Unknown'}</td>
                        <td className="text-foreground p-2">{failure.associationId ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {component.kind === 'STORAGE' && (
          <div className="mt-5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h3 className="text-foreground text-sm font-semibold">Storage disks</h3>
                <p className="text-muted-foreground mt-1 text-xs">
                  Capacity and utilization reported by every filesystem visible to monitoring.
                </p>
              </div>
              {storage && (
                <span className="text-muted-foreground text-xs tabular-nums">
                  Combined: {storage.usedTerabytes.toFixed(3)} TB used of {storage.totalTerabytes.toFixed(3)} TB
                </span>
              )}
            </div>
            {!storage?.disks.length ? (
              <p className="text-muted-foreground mt-3 text-sm">No disk details are available.</p>
            ) : (
              <div className="mswnh-scroll-region border-input/60 mt-3 overflow-auto rounded-lg border">
                <table className="w-full min-w-[850px] border-collapse text-left text-xs">
                  <thead className="bg-muted sticky top-0">
                    <tr className="text-muted-foreground">
                      <th className="p-3">Disk</th>
                      <th className="p-3">Identifier</th>
                      <th className="p-3">Mount path</th>
                      <th className="p-3 text-right">Total</th>
                      <th className="p-3 text-right">Used</th>
                      <th className="p-3 text-right">Remaining</th>
                      <th className="p-3">Utilization</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storage.disks.map(disk => (
                      <tr key={disk.id} className="border-input/50 border-t">
                        <td className="text-foreground p-3 font-medium">{disk.name}</td>
                        <td className="text-foreground p-3 font-mono">{disk.id}</td>
                        <td className="text-foreground max-w-64 break-all p-3 font-mono">{disk.mountPath}</td>
                        <td className="text-foreground p-3 text-right tabular-nums">{disk.totalTerabytes.toFixed(3)} TB</td>
                        <td className="text-foreground p-3 text-right tabular-nums">{disk.usedTerabytes.toFixed(3)} TB</td>
                        <td className="text-foreground p-3 text-right tabular-nums">{disk.remainingTerabytes.toFixed(3)} TB</td>
                        <td className="p-3">
                          <div className="flex min-w-28 items-center gap-2">
                            <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                              <div
                                className={`${disk.state === 'CRITICAL' ? 'bg-red-500' : disk.state === 'WARNING' ? 'bg-amber-400' : 'bg-emerald-500'} h-full rounded-full`}
                                style={{ width: `${Math.min(Math.max(disk.usedPercent, 0), 100)}%` }}
                              />
                            </div>
                            <span className="text-foreground w-12 text-right tabular-nums">{disk.usedPercent.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="p-3"><SystemStatusBadge state={disk.state} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        <p className="text-muted-foreground mt-4 text-xs">
          This is a read-only status view. No infrastructure action is available here.
        </p>
      </section>
    </div>
  );
}
