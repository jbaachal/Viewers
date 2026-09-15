import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@ohif/ui-next';

import { DashboardLoadingSkeleton, DashboardSection } from '../components/dashboard';
import {
  OfflineDevicesDialog,
  SystemComponentCard,
  SystemDetailsDialog,
  SystemStatusBadge,
} from '../components/system';
import { useDashboardContext } from '../context/DashboardProvider';
import type { HealthState, SystemHealthComponent, SystemHealthSnapshot } from '../models';
import { formatKampalaDateTime } from '../utils/formatDashboardDate';

const tone: Record<HealthState, 'healthy' | 'warning' | 'critical' | 'info'> = {
  HEALTHY: 'healthy',
  WARNING: 'warning',
  CRITICAL: 'critical',
  OFFLINE: 'critical',
  UNKNOWN: 'info',
  NOT_CONFIGURED: 'info',
};

function SummaryCard({
  label,
  value,
  detail,
  state = 'info',
  action,
  onClick,
}: {
  label: string;
  value: string;
  detail: string;
  state?: 'healthy' | 'warning' | 'critical' | 'info';
  action?: React.ReactNode;
  onClick?: () => void;
}) {
  const styles = {
    healthy: 'border-emerald-400/30 bg-emerald-400/5',
    warning: 'border-amber-400/30 bg-amber-400/5',
    critical: 'border-red-400/30 bg-red-400/5',
    info: 'border-primary/30 bg-primary/5',
  };
  const content = (
    <>
      <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">{label}</p>
      <strong className="text-foreground mt-2 block text-2xl tabular-nums">{value}</strong>
      <p className="text-muted-foreground mt-1 text-xs">{detail}</p>
      {action && <div className="mt-3">{action}</div>}
    </>
  );
  const className = `${styles[state]} min-h-28 rounded-xl border p-4`;
  if (onClick) {
    return (
      <button
        type="button"
        className={`${className} hover:border-primary focus-visible:ring-primary w-full text-left transition focus-visible:outline-none focus-visible:ring-2`}
        aria-label={`View ${label.toLowerCase()} details`}
        onClick={onClick}
      >
        {content}
      </button>
    );
  }
  return <section className={className}>{content}</section>;
}

export function SystemMonitoring() {
  const { services, demoRole } = useDashboardContext();
  const [snapshot, setSnapshot] = useState<SystemHealthSnapshot | null>(null);
  const [selected, setSelected] = useState<SystemHealthComponent | null>(null);
  const [showOfflineDevices, setShowOfflineDevices] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const allowed = demoRole === 'PACS_ADMIN';

  const refresh = useCallback(async () => {
    if (!services || !allowed) return;
    setLoading(true);
    try {
      setSnapshot(await services.systemMonitoring.getSnapshot());
      setError(null);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'System monitoring data could not be loaded.'
      );
    } finally {
      setLoading(false);
    }
  }, [allowed, services]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const infrastructureComponents = useMemo(
    () => snapshot?.components.filter(component => component.kind !== 'MODALITY') ?? [],
    [snapshot]
  );
  const offlineDevices = useMemo(
    () => snapshot?.devices.filter(device => device.state === 'OFFLINE') ?? [],
    [snapshot]
  );

  if (!allowed)
    return (
      <div className="mx-auto max-w-3xl p-6">
        <section className="border-destructive/40 bg-destructive/10 rounded-xl border p-8 text-center">
          <h1 className="text-foreground text-xl font-semibold">
            PACS administrator access required
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            System monitoring is restricted to authorised PACS administrators.
          </p>
        </section>
      </div>
    );

  return (
    <div className="mx-auto max-w-[1900px] space-y-5 p-3 sm:p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-foreground text-2xl font-semibold">System Monitoring</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Infrastructure, interfaces, modalities, backup and storage overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          {snapshot && (
            <span
              className={`${snapshot.dataSource === 'LIVE' ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : 'border-amber-400/40 bg-amber-400/10 text-amber-300'} rounded-full border px-3 py-1.5 text-xs font-semibold`}
            >
              {snapshot.dataSource === 'LIVE' ? 'Live monitoring' : 'Demonstration data'}
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => void refresh()}
            disabled={loading}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </div>

      <section
        role="note"
        className="border-primary/30 bg-primary/5 text-muted-foreground rounded-xl border p-4 text-sm"
      >
        <strong className="text-foreground">Monitoring scope:</strong> Configured services use live
        point-in-time checks. Every configured DICOM AE endpoint is grouped under its physical
        device and checked independently.
      </section>

      {error && (
        <section
          role="alert"
          className="border-destructive/50 bg-destructive/10 rounded-xl border p-6 text-center"
        >
          <p className="text-foreground">{error}</p>
          <Button
            className="mt-3"
            onClick={() => void refresh()}
          >
            Try again
          </Button>
        </section>
      )}
      {loading && !snapshot ? (
        <DashboardLoadingSkeleton label="Loading system monitoring" />
      ) : snapshot ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
            <SummaryCard
              label="Current availability"
              value={`${snapshot.availabilityPercent.toFixed(2)}%`}
              detail={snapshot.availabilityWindow}
              state={tone[snapshot.overallState]}
            />
            <SummaryCard
              label="Storage used"
              value={
                snapshot.storage ? `${snapshot.storage.usedPercent.toFixed(1)}%` : 'Unavailable'
              }
              detail={
                snapshot.storage
                  ? `${snapshot.storage.usedTerabytes} TB of ${snapshot.storage.totalTerabytes} TB`
                  : 'Storage telemetry is not configured'
              }
              state={
                snapshot.storage
                  ? snapshot.storage.usedPercent >= 90
                    ? 'critical'
                    : snapshot.storage.usedPercent >= 80
                      ? 'warning'
                      : 'healthy'
                  : 'info'
              }
            />
            <SummaryCard
              label="Storage remaining"
              value={snapshot.storage ? `${snapshot.storage.remainingTerabytes} TB` : 'Unavailable'}
              detail={
                snapshot.storage?.estimatedExhaustionDate
                  ? `Estimated exhaustion ${formatKampalaDateTime(snapshot.storage.estimatedExhaustionDate)}`
                  : snapshot.storage
                    ? 'Collecting usage history for capacity projection'
                    : 'No capacity projection available'
              }
              state={
                snapshot.storage
                  ? snapshot.storage.usedPercent >= 90
                    ? 'critical'
                    : snapshot.storage.usedPercent >= 80
                      ? 'warning'
                      : 'healthy'
                  : 'info'
              }
            />
            <SummaryCard
              label="Last backup"
              value={
                snapshot.lastSuccessfulBackupAt
                  ? formatKampalaDateTime(snapshot.lastSuccessfulBackupAt)
                  : 'Unavailable'
              }
              detail={
                snapshot.lastSuccessfulBackupAt
                  ? 'Last verified successful backup'
                  : 'Backup telemetry is not configured'
              }
              state={snapshot.lastSuccessfulBackupAt ? 'healthy' : 'info'}
            />
            <SummaryCard
              label="Failed DICOM associations"
              value={
                snapshot.failedDicomAssociations24Hours === null
                  ? 'Unavailable'
                  : snapshot.failedDicomAssociations24Hours.toLocaleString()
              }
              detail={
                snapshot.failedDicomAssociations24Hours === null
                  ? 'Archive association metrics are not configured'
                  : 'During the last 24 hours'
              }
              state={
                snapshot.failedDicomAssociations24Hours
                  ? 'warning'
                  : snapshot.failedDicomAssociations24Hours === 0
                    ? 'healthy'
                    : 'info'
              }
            />
            <SummaryCard
              label="Devices offline"
              value={
                snapshot.offlineModalityCount === null
                  ? 'Unknown'
                  : snapshot.offlineModalityCount.toLocaleString()
              }
              detail={
                snapshot.offlineModalityCount === null
                  ? 'Complete production C-ECHO endpoints in Device Inventory'
                  : 'Devices requiring attention'
              }
              state={
                snapshot.offlineModalityCount
                  ? 'critical'
                  : snapshot.offlineModalityCount === 0
                    ? 'healthy'
                    : 'info'
              }
              onClick={offlineDevices.length ? () => setShowOfflineDevices(true) : undefined}
              action={
                snapshot.offlineModalityCount === null ? (
                  <a
                    href="/dashboard/administration/devices"
                    className="text-primary text-xs font-medium hover:underline"
                  >
                    Configure device monitoring
                  </a>
                ) : undefined
              }
            />
          </div>

          {snapshot.storage && (
            <DashboardSection
              title="Storage capacity"
              description="Live capacity projection"
            >
              <div className="p-4">
                <div className="bg-muted h-3 overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{ width: `${Math.min(snapshot.storage.usedPercent, 100)}%` }}
                  />
                </div>
                <div className="text-muted-foreground mt-2 flex flex-wrap justify-between gap-2 text-xs">
                  <span>{snapshot.storage.usedTerabytes} TB used</span>
                  <span>{snapshot.storage.remainingTerabytes} TB remaining</span>
                  <span>
                    Estimated exhaustion:{' '}
                    {snapshot.storage.estimatedExhaustionDate
                      ? formatKampalaDateTime(snapshot.storage.estimatedExhaustionDate)
                      : 'Unavailable'}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {snapshot.storage.disks.map(disk => (
                    <article
                      key={disk.id}
                      className="border-input/60 bg-background rounded-lg border p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <strong className="text-foreground text-sm">{disk.name}</strong>
                          <span className="text-muted-foreground block break-all text-xs">
                            {disk.mountPath}
                          </span>
                        </div>
                        <span
                          className={`${disk.state === 'CRITICAL' ? 'text-red-400' : disk.state === 'WARNING' ? 'text-amber-400' : 'text-emerald-400'} text-xs font-semibold`}
                        >
                          {disk.usedPercent.toFixed(1)}% used
                        </span>
                      </div>
                      <div className="bg-muted mt-3 h-2 overflow-hidden rounded-full">
                        <div
                          className={`${disk.state === 'CRITICAL' ? 'bg-red-500' : disk.state === 'WARNING' ? 'bg-amber-400' : 'bg-emerald-400'} h-full rounded-full`}
                          style={{ width: `${Math.min(disk.usedPercent, 100)}%` }}
                        />
                      </div>
                      <p className="text-muted-foreground mt-2 text-xs">
                        {disk.usedTerabytes} TB used · {disk.remainingTerabytes} TB free ·{' '}
                        {disk.totalTerabytes} TB total
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </DashboardSection>
          )}

          <DashboardSection
            title="Component health"
            description={`${infrastructureComponents.length} infrastructure components · Select a card for details`}
            action={
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">Overall</span>
                <SystemStatusBadge state={snapshot.overallState} />
              </div>
            }
          >
            <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {infrastructureComponents.map(component => (
                <SystemComponentCard
                  key={component.id}
                  component={component}
                  onViewDetails={setSelected}
                />
              ))}
            </div>
          </DashboardSection>

          <p className="text-muted-foreground text-right text-xs">
            Generated {formatKampalaDateTime(snapshot.generatedAt)}
          </p>
        </>
      ) : null}
      <SystemDetailsDialog
        component={selected}
        storage={snapshot?.storage}
        onClose={() => setSelected(null)}
      />
      <OfflineDevicesDialog
        open={showOfflineDevices}
        devices={offlineDevices}
        onClose={() => setShowOfflineDevices(false)}
      />
    </div>
  );
}
