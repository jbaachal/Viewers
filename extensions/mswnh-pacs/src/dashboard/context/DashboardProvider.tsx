import React, { createContext, useContext, useMemo } from 'react';
import { useUserAuthentication } from '@ohif/ui-next';

import {
  DashboardIntegrationUnavailableError,
  getDashboardServices,
  type DashboardServices,
} from '../services';

export type DemoRole = 'RADIOLOGIST' | 'MANAGEMENT' | 'PACS_ADMIN' | 'READ_ONLY';

type DashboardContextValue = {
  services: DashboardServices | null;
  initializationError: Error | null;
  demoRole: DemoRole;
  setDemoRole: (role: DemoRole) => void;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

function getRealmRoles(user: any): string[] {
  const directRoles = user?.profile?.realm_access?.roles || user?.realm_access?.roles;
  if (Array.isArray(directRoles)) return directRoles;
  const token = user?.access_token;
  if (typeof token !== 'string') return [];
  try {
    const rawPayload = token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/');
    const payload = rawPayload.padEnd(Math.ceil(rawPayload.length / 4) * 4, '=');
    const decoded = JSON.parse(window.atob(payload));
    return Array.isArray(decoded?.realm_access?.roles) ? decoded.realm_access.roles : [];
  } catch {
    return [];
  }
}

export function DashboardProvider({
  children,
  servicesManager,
}: {
  children: React.ReactNode;
  servicesManager: any;
}) {
  const [{ user }] = useUserAuthentication() as any;
  const authentication = servicesManager?.services?.userAuthenticationService;
  const serviceState = useMemo(() => {
    try {
      return {
        services: getDashboardServices({
          getAuthorizationHeaders: () => authentication?.getAuthorizationHeader?.() || {},
          handleUnauthenticated: () => authentication?.handleUnauthenticated?.(),
        }),
        initializationError: null,
      };
    } catch (error) {
      return {
        services: null,
        initializationError:
          error instanceof Error ? error : new DashboardIntegrationUnavailableError(),
      };
    }
  }, [authentication]);

  const demoRole = useMemo<DemoRole>(() => {
    const roles = new Set(getRealmRoles(user).map(role => role.toUpperCase()));
    if (['ADMINISTRATOR', 'PACS_ADMIN', 'ROOT', 'ADMIN'].some(role => roles.has(role))) {
      return 'PACS_ADMIN';
    }
    if (['RADIOLOGY_MANAGER', 'MANAGEMENT'].some(role => roles.has(role))) return 'MANAGEMENT';
    return roles.has('RADIOLOGIST') ? 'RADIOLOGIST' : 'READ_ONLY';
  }, [user]);

  const value = useMemo(
    () => ({ ...serviceState, demoRole, setDemoRole: () => undefined }),
    [demoRole, serviceState]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboardContext(): DashboardContextValue {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardContext must be used inside DashboardProvider.');
  }
  return context;
}
