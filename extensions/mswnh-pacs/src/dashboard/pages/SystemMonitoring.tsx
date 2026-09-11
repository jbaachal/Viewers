import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Icons } from '@ohif/ui-next';

import { DashboardSection } from '../components/dashboard';
import {
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

function SummaryCard({ label, value, detail, state = 'info' }: { label: string; value: string; detail: string; state?: 'healthy' | 'warning' | 'critical' | 'info' }) {
  const styles = {
    healthy: 'border-emerald-400/30 bg-emerald-400/5',
    warning: 'border-amber-400/30 bg-amber-400/5',
    critical: 'border-red-400/30 bg-red-400/5',
    info: 'border-primary/30 bg-primary/5',
  };
  return <section className={`${styles[state]} min-h-28 rounded-xl border p-4`}><p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">{label}</p><strong className="text-foreground mt-2 block text-2xl tabular-nums">{value}</strong><p className="text-muted-foreground mt-1 text-xs">{detail}</p></section>;
}

export function SystemMonitoring() {
  const { services, demoRole } = useDashboardContext();
  const [snapshot, setSnapshot] = useState<SystemHealthSnapshot | null>(null);
  const [selected, setSelected] = useState<SystemHealthComponent | null>(null);
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
      setError(reason instanceof Error ? reason.message : 'System monitoring data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [allowed, services]);

  useEffect(() => { void refresh(); }, [refresh]);

  const modalities = useMemo(
    () => snapshot?.components.filter(component => component.kind === 'MODALITY') ?? [],
    [snapshot]
  );

  if (!allowed) return <div className="mx-auto max-w-3xl p-6"><section className="border-destructive/40 bg-destructive/10 rounded-xl border p-8 text-center"><h1 className="text-foreground text-xl font-semibold">PACS administrator access required</h1><p className="text-muted-foreground mt-2 text-sm">System monitoring is restricted to authorised PACS administrators.</p></section></div>;

  return (
    <div className="mx-auto max-w-[1900px] space-y-5 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><div className="text-primary mb-1 text-xs font-semibold uppercase tracking-[0.16em]">MSWNH PACS</div><h1 className="text-foreground text-2xl font-semibold">System Monitoring</h1><p className="text-muted-foreground mt-1 text-sm">Infrastructure, interfaces, modalities, backup and storage overview</p></div>
        <div className="flex items-center gap-2">{snapshot && <span className={`${snapshot.dataSource === 'LIVE' ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : 'border-amber-400/40 bg-amber-400/10 text-amber-300'} rounded-full border px-3 py-1.5 text-xs font-semibold`}>{snapshot.dataSource === 'LIVE' ? 'Live monitoring' : 'Demonstration data'}</span>}<Button type="button" variant="outline" onClick={() => void refresh()} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</Button></div>
      </div>

      <section role="note" className="border-primary/30 bg-primary/5 text-muted-foreground rounded-xl border p-4 text-sm"><strong className="text-foreground">Monitoring scope:</strong> Configured services use live point-in-time checks. Unsupported metrics and device-level probes are explicitly marked Unknown or Not configured.</section>

      {error && <section role="alert" className="border-destructive/50 bg-destructive/10 rounded-xl border p-6 text-center"><p className="text-foreground">{error}</p><Button className="mt-3" onClick={() => void refresh()}>Try again</Button></section>}
      {loading && !snapshot ? <div className="text-muted-foreground grid min-h-80 place-items-center"><span className="flex items-center gap-2"><Icons.LoadingSpinner className="text-primary h-5 w-5 animate-spin" /> Loading system monitoring…</span></div> : snapshot ? <>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          <SummaryCard label="Current availability" value={`${snapshot.availabilityPercent.toFixed(2)}%`} detail={snapshot.availabilityWindow} state={tone[snapshot.overallState]} />
          <SummaryCard label="Storage used" value={snapshot.storage ? `${snapshot.storage.usedPercent.toFixed(1)}%` : 'Unavailable'} detail={snapshot.storage ? `${snapshot.storage.usedTerabytes} TB of ${snapshot.storage.totalTerabytes} TB` : 'Storage telemetry is not configured'} state={snapshot.storage ? (snapshot.storage.usedPercent >= 90 ? 'critical' : snapshot.storage.usedPercent >= 75 ? 'warning' : 'healthy') : 'info'} />
          <SummaryCard label="Storage remaining" value={snapshot.storage ? `${snapshot.storage.remainingTerabytes} TB` : 'Unavailable'} detail={snapshot.storage?.estimatedExhaustionDate ? `Estimated exhaustion ${formatKampalaDateTime(snapshot.storage.estimatedExhaustionDate)}` : 'No capacity projection available'} state={snapshot.storage ? 'warning' : 'info'} />
          <SummaryCard label="Last backup" value={snapshot.lastSuccessfulBackupAt ? formatKampalaDateTime(snapshot.lastSuccessfulBackupAt) : 'Unavailable'} detail={snapshot.lastSuccessfulBackupAt ? 'Last verified successful backup' : 'Backup telemetry is not configured'} state={snapshot.lastSuccessfulBackupAt ? 'healthy' : 'info'} />
          <SummaryCard label="Failed DICOM associations" value={snapshot.failedDicomAssociations24Hours === null ? 'Unavailable' : snapshot.failedDicomAssociations24Hours.toLocaleString()} detail={snapshot.failedDicomAssociations24Hours === null ? 'Archive association metrics are not configured' : 'During the last 24 hours'} state={snapshot.failedDicomAssociations24Hours ? 'warning' : snapshot.failedDicomAssociations24Hours === 0 ? 'healthy' : 'info'} />
          <SummaryCard label="Modalities offline" value={snapshot.offlineModalityCount === null ? 'Unknown' : snapshot.offlineModalityCount.toLocaleString()} detail={snapshot.offlineModalityCount === null ? 'DICOM C-ECHO probes are not configured' : 'Devices requiring attention'} state={snapshot.offlineModalityCount ? 'critical' : snapshot.offlineModalityCount === 0 ? 'healthy' : 'info'} />
        </div>

        {snapshot.storage && <DashboardSection title="Storage capacity" description="Live capacity projection"><div className="p-4"><div className="bg-muted h-3 overflow-hidden rounded-full"><div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.min(snapshot.storage.usedPercent, 100)}%` }} /></div><div className="text-muted-foreground mt-2 flex flex-wrap justify-between gap-2 text-xs"><span>{snapshot.storage.usedTerabytes} TB used</span><span>{snapshot.storage.remainingTerabytes} TB remaining</span><span>Estimated exhaustion: {snapshot.storage.estimatedExhaustionDate ? formatKampalaDateTime(snapshot.storage.estimatedExhaustionDate) : 'Unavailable'}</span></div></div></DashboardSection>}

        <DashboardSection title="Component health" description={`${snapshot.components.length} monitored components · Select a card for details`} action={<div className="flex items-center gap-2"><span className="text-muted-foreground text-xs">Overall</span><SystemStatusBadge state={snapshot.overallState} /></div>}>
          <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{snapshot.components.map(component => <SystemComponentCard key={component.id} component={component} onViewDetails={setSelected} />)}</div>
        </DashboardSection>

        <DashboardSection title="Last study received by modality" description="Live workflow receipt times in Africa/Kampala; device connectivity is not inferred">
          <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-muted/30 text-muted-foreground"><tr><th className="p-3">Modality</th><th className="p-3">Status</th><th className="p-3">Last study received</th><th className="p-3">Message</th></tr></thead><tbody>{modalities.map(component => <tr key={component.id} className="border-input/40 border-t"><td className="text-foreground p-3 font-medium">{component.name}</td><td className="p-3"><SystemStatusBadge state={component.state} /></td><td className="text-foreground p-3">{component.lastStudyReceivedAt ? formatKampalaDateTime(component.lastStudyReceivedAt) : 'No study recorded'}</td><td className="text-muted-foreground p-3">{component.message}</td></tr>)}</tbody></table></div>
        </DashboardSection>

        <p className="text-muted-foreground text-right text-xs">Generated {formatKampalaDateTime(snapshot.generatedAt)}</p>
      </> : null}
      <SystemDetailsDialog component={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
