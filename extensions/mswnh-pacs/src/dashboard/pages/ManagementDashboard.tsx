import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Icons } from '@ohif/ui-next';
import { useNavigate } from 'react-router-dom';

import {
  ManagementBarChart,
  ManagementFilters,
  ManagementMetricCard,
} from '../components/management';
import { useDashboardContext } from '../context/DashboardProvider';
import type { ManagementReport, ManagementReportFilters } from '../models';

function kampalaDate(value = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Kampala',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(item => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function daysBefore(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() - days);
  return value.toISOString().slice(0, 10);
}

function defaultFilters(): ManagementReportFilters {
  const to = kampalaDate();
  return { from: daysBefore(to, 6), to, modality: '', priority: '', status: '', location: '' };
}

function minutes(value: number | null): string {
  if (value === null) return 'Unavailable';
  if (value < 60) return `${Math.round(value)} min`;
  return `${Math.floor(value / 60)}h ${Math.round(value % 60)}m`;
}

function percent(value: number | null): string {
  return value === null ? 'Unavailable' : `${value.toFixed(1)}%`;
}

export function ManagementDashboard() {
  const navigate = useNavigate();
  const { services, demoRole } = useDashboardContext();
  const initial = useMemo(defaultFilters, []);
  const [draft, setDraft] = useState(initial);
  const [filters, setFilters] = useState(initial);
  const [report, setReport] = useState<ManagementReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const allowed = demoRole === 'PACS_ADMIN' || demoRole === 'MANAGEMENT';

  const load = useCallback(async () => {
    if (!services || !allowed) return;
    setLoading(true);
    try {
      setReport(await services.management.getReport(filters));
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Management reports could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [allowed, filters, services]);

  useEffect(() => {
    void load();
  }, [load]);

  const openWorklist = (parameters: Record<string, string> = {}) => {
    const query = new URLSearchParams({ from: filters.from, to: filters.to, ...parameters });
    navigate(`/worklist?${query}`);
  };

  if (!allowed) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <section className="border-destructive/40 bg-destructive/10 rounded-xl border p-8 text-center">
          <h1 className="text-foreground text-xl font-semibold">Management access required</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            PACS management reports are restricted to authorised management and administrator roles.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1900px] space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-primary mb-1 text-xs font-semibold uppercase tracking-[0.16em]">MSWNH PACS</div>
          <h1 className="text-foreground text-2xl font-semibold">Management Reports</h1>
          <p className="text-muted-foreground mt-1 text-sm">Operational performance and SLA analytics · Africa/Kampala time</p>
        </div>
        <span className="border-primary/30 bg-primary/10 text-primary rounded-full border px-3 py-1.5 text-xs">Live workflow data</span>
      </div>

      <ManagementFilters
        value={draft}
        loading={loading}
        onChange={setDraft}
        onApply={() => setFilters(draft)}
        onReset={() => {
          const reset = defaultFilters();
          setDraft(reset);
          setFilters(reset);
        }}
      />

      {error && (
        <section role="alert" className="border-destructive/50 bg-destructive/10 rounded-xl border p-6 text-center">
          <p className="text-foreground">{error}</p>
          <Button className="mt-3" onClick={() => void load()}>Try again</Button>
        </section>
      )}

      {loading && !report ? (
        <div className="text-muted-foreground grid min-h-80 place-items-center">
          <span className="flex items-center gap-2"><Icons.LoadingSpinner className="text-primary h-5 w-5 animate-spin" /> Loading management report…</span>
        </div>
      ) : report ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
            <ManagementMetricCard label="Examinations" value={report.summary.totalExaminations.toLocaleString()} detail="Received in selected period" onClick={() => openWorklist()} />
            <ManagementMetricCard label="Active backlog" value={report.summary.activeBacklog.toLocaleString()} detail="Received, assigned or in review" tone={report.summary.activeBacklog ? 'warning' : 'healthy'} onClick={() => openWorklist({ status: 'unread' })} />
            <ManagementMetricCard label="Emergency / urgent" value={report.summary.emergencyAndUrgent.toLocaleString()} detail="High-priority workload" tone={report.summary.emergencyAndUrgent ? 'critical' : 'healthy'} />
            <ManagementMetricCard label="Average TAT" value={minutes(report.summary.averageReportTurnaroundMinutes)} detail="Receipt to signed report" />
            <ManagementMetricCard label="Within SLA" value={percent(report.summary.reportedWithinSlaPercent)} detail="Signed by deadline" tone={(report.summary.reportedWithinSlaPercent ?? 100) >= 90 ? 'healthy' : 'warning'} />
            <ManagementMetricCard label="Awaiting verification" value={report.summary.awaitingVerification.toLocaleString()} detail="Reported, not verified" onClick={() => openWorklist({ status: 'reported' })} />
            <ManagementMetricCard label="Overdue" value={report.summary.overdue.toLocaleString()} detail="Active SLA breaches" tone={report.summary.overdue ? 'critical' : 'healthy'} onClick={() => openWorklist({ overdue: 'true' })} />
            <ManagementMetricCard label="Exceptions" value={report.summary.cancelledOrIncomplete.toLocaleString()} detail="Cancelled or incomplete" tone={report.summary.cancelledOrIncomplete ? 'warning' : 'healthy'} />
          </div>

          {report.summary.totalExaminations === 0 && (
            <div className="border-input/60 bg-card text-muted-foreground rounded-xl border p-8 text-center text-sm">No examinations match the selected filters.</div>
          )}

          <div className="grid gap-4 xl:grid-cols-2">
            <ManagementBarChart title="Daily examination volume" description="Studies received per Kampala calendar day" data={report.dailyVolume} />
            <ManagementBarChart title="Examinations by modality" data={report.byModality} onSelect={item => openWorklist({ modality: item.label.toLocaleLowerCase() })} />
            <ManagementBarChart title="Workflow status" data={report.workflowStatuses} onSelect={item => openWorklist({ status: item.label === 'InReview' ? 'in_review' : item.label.toLocaleLowerCase() })} />
            <ManagementBarChart title="Clinical priority" data={report.priorities} onSelect={item => openWorklist({ priority: item.label.toLocaleLowerCase() })} />
            <ManagementBarChart title="Average turnaround by report date" description="Minutes from archive receipt to signed report" data={report.turnaroundTrend} suffix=" min" />
            <ManagementBarChart title="SLA compliance by priority" description="Percentage of signed reports completed within SLA" data={report.slaByPriority} suffix="%" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ManagementBarChart title="Cancellation reasons" data={report.cancellationReasons} />
            <ManagementBarChart title="Incomplete examination reasons" data={report.incompleteReasons} />
          </div>

          <p className="text-muted-foreground text-right text-xs">Generated {new Date(report.generatedAt).toLocaleString('en-GB', { timeZone: 'Africa/Kampala' })}</p>
        </>
      ) : null}
    </div>
  );
}
