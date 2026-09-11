import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icons, Tooltip, TooltipContent, TooltipTrigger } from '@ohif/ui-next';

import type { DemoRole } from '../../context/DashboardProvider';
import { navigationItems } from './navigation';

export function NavigationItems({ role, onNavigate }: { role: DemoRole; onNavigate?: () => void }) {
  const location = useLocation();
  const currentQuery = new URLSearchParams(location.search);

  const isItemActive = (to: string) => {
    const [pathname, queryString] = to.split('?');
    if (location.pathname !== pathname) return false;
    if (!queryString) {
      return (
        pathname !== '/worklist' ||
        !['assigned', 'priority', 'status'].some(key => currentQuery.has(key))
      );
    }
    return Array.from(new URLSearchParams(queryString)).every(
      ([key, value]) => currentQuery.get(key)?.toLowerCase() === value.toLowerCase()
    );
  };

  return (
    <nav
      aria-label="PACS dashboard navigation"
      className="flex flex-col gap-1"
    >
      {navigationItems
        .filter(item => !item.roles || item.roles.includes(role))
        .map(item => {
          const icon = (
            <Icons.ByName
              name={item.icon}
              className="h-4 w-4 shrink-0"
            />
          );
          if (item.disabled || !item.to) {
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    disabled
                    className="text-muted-foreground opacity-55 flex w-full cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-left text-base"
                  >
                    {icon}
                    <span>{item.label}</span>
                    <span className="ml-auto text-[10px] uppercase tracking-wide">Later</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Not available in this frontend prototype
                </TooltipContent>
              </Tooltip>
            );
          }

          const isActive = isItemActive(item.to);
          return (
            <Link
              key={item.id}
              to={item.to}
              onClick={onNavigate}
              aria-current={isActive ? 'page' : undefined}
              className={`focus-visible:ring-ring flex items-center gap-3 rounded-md px-3 py-2 text-base transition-colors focus-visible:outline-none focus-visible:ring-1 ${
                isActive
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground'
              }`}
            >
              {icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
    </nav>
  );
}
