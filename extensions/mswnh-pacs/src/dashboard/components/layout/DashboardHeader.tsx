import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSystem } from '@ohif/core';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Icons,
  Input,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  useModal,
  useActiveTheme,
  useUserAuthentication,
} from '@ohif/ui-next';

import type { DashboardAlert, HealthState } from '../../models';
import { useDashboardContext, type DemoRole } from '../../context/DashboardProvider';
import { useKampalaClock } from '../../hooks/useKampalaClock';
import { ChangePasswordDialog } from '../account/ChangePasswordDialog';

const roleLabels: Record<DemoRole, string> = {
  RADIOLOGIST: 'Radiologist',
  MANAGEMENT: 'Management',
  PACS_ADMIN: 'PACS Administrator',
  READ_ONLY: 'Clinical viewer',
};

function getUserName(user: any): string {
  return (
    user?.profile?.name ||
    user?.name ||
    user?.profile?.preferred_username ||
    user?.preferred_username ||
    'Dr Sarah Akello'
  );
}

function HealthIndicator({ state }: { state: HealthState | 'UNKNOWN' }) {
  const style = {
    HEALTHY: 'bg-emerald-400',
    WARNING: 'bg-amber-400',
    CRITICAL: 'bg-red-500',
    OFFLINE: 'bg-slate-500',
    UNKNOWN: 'bg-slate-500',
    NOT_CONFIGURED: 'bg-slate-500',
  }[state];

  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-2.5 w-2.5 rounded-full ${style}`}
        aria-hidden="true"
      />
      <span className="hidden text-sm font-medium xl:inline">
        {state === 'HEALTHY'
          ? 'Systems healthy'
          : state === 'UNKNOWN'
            ? 'Health unavailable'
            : state === 'NOT_CONFIGURED'
              ? 'Health not configured'
              : `System ${state.toLowerCase()}`}
      </span>
    </div>
  );
}

export function DashboardHeader({
  onOpenNavigation,
  sidebarCollapsed,
  onToggleSidebar,
}: {
  onOpenNavigation: () => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}) {
  const navigate = useNavigate();
  const { servicesManager } = useSystem();
  const { customizationService } = servicesManager.services as any;
  const { show } = useModal();
  const { appearanceMode, setAppearanceMode } = useActiveTheme();
  // Runtime value is [state, api]; the legacy source declaration infers only state.
  const [{ user }] = useUserAuthentication() as any;
  const { services, demoRole } = useDashboardContext();
  const { date, time, timeZone } = useKampalaClock();
  const [search, setSearch] = useState('');
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [healthState, setHealthState] = useState<HealthState | 'UNKNOWN'>('UNKNOWN');
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const refreshHeaderState = useCallback(async () => {
    if (!services) return;
    try {
      const [workflowResult, deviceResult] = await Promise.allSettled([
        services.dataSource === 'LIVE'
          ? services.worklist.getAlerts()
          : services.dashboard.getSnapshot().then(snapshot => snapshot.alerts),
        demoRole === 'PACS_ADMIN'
          ? services.deviceInventory.getNotifications()
          : Promise.resolve([]),
      ]);
      const workflowAlerts = workflowResult.status === 'fulfilled' ? workflowResult.value : [];
      const deviceAlerts = deviceResult.status === 'fulfilled' ? deviceResult.value : [];
      setAlerts([
        ...deviceAlerts.map(alert => ({
          ...alert,
          acknowledged: false,
          href: `/dashboard/administration/devices?device=${encodeURIComponent(alert.deviceId)}`,
        })),
        ...workflowAlerts,
      ]);
    } catch {
      setAlerts([]);
    }

    if (demoRole !== 'PACS_ADMIN') {
      setHealthState('UNKNOWN');
      return;
    }

    try {
      const health = await services.systemMonitoring.getSnapshot();
      setHealthState(health.overallState);
    } catch {
      setHealthState('UNKNOWN');
    }
  }, [demoRole, services]);

  useEffect(() => {
    void refreshHeaderState();
    const unsubscribe =
      services?.dataSource === 'LIVE'
        ? services.worklist.subscribe(() => void refreshHeaderState())
        : services?.dashboard.subscribe(() => void refreshHeaderState());
    const poll =
      services?.dataSource === 'LIVE'
        ? window.setInterval(() => void refreshHeaderState(), 20_000)
        : undefined;
    return () => {
      unsubscribe?.();
      if (poll) window.clearInterval(poll);
    };
  }, [refreshHeaderState, services]);

  const unreadAlerts = useMemo(() => alerts.filter(alert => !alert.acknowledged), [alerts]);
  const userName = getUserName(user);

  const changePassword = async (oldPassword: string, newPassword: string) => {
    if (!services) return;
    setPasswordBusy(true);
    setPasswordError(null);
    try {
      await services.account.changePassword(oldPassword, newPassword);
      setPasswordDialogOpen(false);
      navigate('/logout?redirect_uri=' + encodeURIComponent(window.location.origin));
    } catch (reason) {
      setPasswordError(
        reason instanceof Error ? reason.message : 'The password could not be changed.'
      );
    } finally {
      setPasswordBusy(false);
    }
  };

  const showAbout = () => {
    const AboutModal = customizationService.getCustomization('ohif.aboutModal');
    show({
      content: AboutModal,
      title: AboutModal?.title ?? 'About PACS',
      containerClassName: AboutModal?.containerClassName ?? 'max-w-md',
    });
  };

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/worklist?search=${encodeURIComponent(query)}` : '/worklist');
  };

  const acknowledgeAlert = async (alertId: string) => {
    if (services?.dataSource === 'LIVE') {
      const alert = alerts.find(item => item.id === alertId);
      navigate(
        alert?.href ??
          (alert?.studyId ? `/worklist?study=${encodeURIComponent(alert.studyId)}` : '/worklist')
      );
      return;
    }
    await services?.dashboard.acknowledgeAlert(alertId);
  };

  return (
    <TooltipProvider delayDuration={250}>
      <header className="border-input/50 bg-card min-h-16 relative z-40 flex shrink-0 flex-wrap items-center gap-2 border-b px-2 py-2 shadow-sm sm:gap-3 sm:px-3 md:px-4 lg:flex-nowrap">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open navigation"
          onClick={onOpenNavigation}
        >
          <Icons.NavigationPanelReveal className="h-5 w-5" />
        </Button>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hidden lg:inline-flex"
              aria-label={sidebarCollapsed ? 'Show side menu' : 'Hide side menu'}
              aria-expanded={!sidebarCollapsed}
              aria-controls="dashboard-sidebar"
              onClick={onToggleSidebar}
            >
              <Icons.NavigationPanelReveal
                className={`h-5 w-5 transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{sidebarCollapsed ? 'Show side menu' : 'Hide side menu'}</TooltipContent>
        </Tooltip>

        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="focus-visible:ring-ring flex shrink-0 items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-1"
          aria-label="Go to MSWNH PACS dashboard"
        >
          <img
            src="/hospital-logo.svg"
            alt="Mulago Specialised Women and Neonatal Hospital"
            className="h-9 w-auto object-contain sm:h-10"
          />
          <span className="hidden text-left md:block">
            <span className="text-foreground block text-base font-semibold leading-tight">
              MSWNH PACS
            </span>
          </span>
        </button>

        <form
          role="search"
          onSubmit={submitSearch}
          className="relative order-last mx-auto w-full basis-full lg:order-none lg:min-w-[22rem] lg:max-w-2xl lg:flex-1 lg:basis-auto"
        >
          <label
            htmlFor="pacs-global-search"
            className="sr-only"
          >
            Search by patient name, patient ID, accession number, or Study Instance UID
          </label>
          <Icons.Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            id="pacs-global-search"
            type="search"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Patient, MRN, accession or Study UID"
            className="h-9 w-full pl-8 pr-16"
          />
          <button
            type="submit"
            className="text-primary focus-visible:ring-ring absolute right-2 top-1/2 -translate-y-1/2 rounded px-1 text-xs font-medium focus-visible:outline-none focus-visible:ring-1"
          >
            Search
          </button>
        </form>

        {demoRole === 'PACS_ADMIN' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="focus-visible:ring-ring hidden rounded-md px-2 py-1.5 focus-visible:outline-none focus-visible:ring-1 sm:flex"
                aria-label={`System health: ${healthState.toLowerCase()}`}
                onClick={() => navigate('/dashboard/system')}
              >
                <HealthIndicator state={healthState} />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {services?.dataSource === 'LIVE'
                ? 'Live configured system checks'
                : 'Prototype technical-monitoring status'}
            </TooltipContent>
          </Tooltip>
        )}

        <div className="text-muted-foreground hidden shrink-0 text-right 2xl:block">
          <div className="text-foreground text-sm font-medium tabular-nums">{time}</div>
          <div className="text-xs">
            {date} · {timeZone}
          </div>
        </div>

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="relative"
                  aria-label={`${unreadAlerts.length} unread notifications`}
                >
                  <Icons.AlertOutline className="h-5 w-5" />
                  {unreadAlerts.length > 0 && (
                    <span className="min-w-4 absolute -right-1 -top-1 rounded-full bg-red-500 px-1 text-center text-[10px] font-bold leading-4 text-white">
                      {unreadAlerts.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Notifications</TooltipContent>
          </Tooltip>
          <DropdownMenuContent
            align="end"
            className="w-80"
          >
            <DropdownMenuLabel>
              {services?.dataSource === 'LIVE' ? 'Live notifications' : 'Prototype notifications'}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {alerts.length === 0 && (
              <div className="text-muted-foreground px-3 py-4 text-center text-sm">
                No active notifications.
              </div>
            )}
            {alerts.slice(0, 5).map(alert => (
              <DropdownMenuItem
                key={alert.id}
                className="items-start gap-2 p-2"
                onSelect={() => void acknowledgeAlert(alert.id)}
              >
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${alert.acknowledged ? 'bg-slate-500' : alert.severity === 'CRITICAL' ? 'bg-red-500' : 'bg-amber-400'}`}
                />
                <span>
                  <span className="block text-sm font-medium">{alert.title}</span>
                  <span className="text-muted-foreground block text-xs">{alert.message}</span>
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-10 gap-2 px-2"
              aria-label="Open user profile menu"
            >
              <span className="bg-primary/20 text-primary flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold">
                {userName
                  .split(/\s+/)
                  .slice(-2)
                  .map(part => part[0])
                  .join('')
                  .toUpperCase()}
              </span>
              <span className="max-w-36 hidden text-left xl:block">
                <span className="text-foreground block truncate text-sm font-medium">
                  {userName}
                </span>
                <span className="text-muted-foreground block text-xs">{roleLabels[demoRole]}</span>
              </span>
              <Icons.ChevronDown className="hidden h-3 w-3 xl:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-64"
          >
            <DropdownMenuLabel>
              <span className="text-foreground block font-medium">{userName}</span>
              <span className="text-muted-foreground block text-xs">Authenticated PACS role</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-muted-foreground pt-2 text-xs font-medium uppercase tracking-wide">
              Appearance
            </DropdownMenuLabel>
            {(['light', 'dark', 'system'] as const).map(mode => (
              <DropdownMenuItem
                key={mode}
                onSelect={() => setAppearanceMode(mode)}
                aria-current={appearanceMode === mode ? 'true' : undefined}
              >
                <span
                  className="mr-2 w-4 text-center"
                  aria-hidden="true"
                >
                  {appearanceMode === mode ? '✓' : ''}
                </span>
                {mode === 'light' ? 'Light' : mode === 'dark' ? 'Dark' : 'Use system setting'}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={showAbout}>
              <Icons.Info className="mr-2 h-4 w-4" /> About
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                setPasswordError(null);
                setPasswordDialogOpen(true);
              }}
            >
              <Icons.Lock className="mr-2 h-4 w-4" /> Change Password
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                navigate('/logout?redirect_uri=' + encodeURIComponent(window.location.href))
              }
            >
              <Icons.PowerOff className="mr-2 h-4 w-4" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <ChangePasswordDialog
        open={passwordDialogOpen}
        busy={passwordBusy}
        error={passwordError}
        onChangePassword={changePassword}
        onClose={() => {
          if (!passwordBusy) {
            setPasswordDialogOpen(false);
            setPasswordError(null);
          }
        }}
      />
    </TooltipProvider>
  );
}
