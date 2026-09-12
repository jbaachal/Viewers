import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icons, Tooltip, TooltipContent, TooltipTrigger } from '@ohif/ui-next';

import type { DemoRole } from '../../context/DashboardProvider';
import { navigationItems } from './navigation';

export function NavigationItems({ role, onNavigate }: { role: DemoRole; onNavigate?: () => void }) {
  const location = useLocation();
  const currentQuery = new URLSearchParams(location.search);
  const administration = navigationItems.find(item => item.id === 'administration');
  const administrationActive =
    administration?.children?.some(item => item.to && isPathActive(item.to)) ?? false;
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    () => new Set(administrationActive ? ['administration'] : [])
  );

  function isPathActive(to: string) {
    return location.pathname === to.split('?')[0];
  }

  useEffect(() => {
    if (administrationActive) {
      setExpandedItems(items => new Set(items).add('administration'));
    }
  }, [administrationActive]);

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
          const visibleChildren = item.children?.filter(
            child => !child.roles || child.roles.includes(role)
          );
          const icon = (
            <Icons.ByName
              name={item.icon}
              className="h-4 w-4 shrink-0"
            />
          );
          if (visibleChildren?.length) {
            const expanded = expandedItems.has(item.id);
            const childActive = visibleChildren.some(child => child.to && isItemActive(child.to));
            return (
              <div key={item.id}>
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={`${item.id}-navigation-items`}
                  onClick={() =>
                    setExpandedItems(items => {
                      const next = new Set(items);
                      if (next.has(item.id)) next.delete(item.id);
                      else next.add(item.id);
                      return next;
                    })
                  }
                  className={`focus-visible:ring-ring flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-base transition-colors focus-visible:outline-none focus-visible:ring-1 ${
                    childActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground'
                  }`}
                >
                  {icon}
                  <span>{item.label}</span>
                  <Icons.ChevronDown
                    className={`ml-auto h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                  />
                </button>
                {expanded && (
                  <div
                    id={`${item.id}-navigation-items`}
                    className="border-input/60 ml-5 mt-1 flex flex-col gap-1 border-l pl-2"
                  >
                    {visibleChildren.map(child => {
                      const active = child.to ? isItemActive(child.to) : false;
                      return (
                        <Link
                          key={child.id}
                          to={child.to!}
                          onClick={onNavigate}
                          aria-current={active ? 'page' : undefined}
                          className={`focus-visible:ring-ring flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 ${
                            active
                              ? 'bg-primary/20 text-primary'
                              : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground'
                          }`}
                        >
                          <Icons.ByName
                            name={child.icon}
                            className="h-3.5 w-3.5 shrink-0"
                          />
                          <span>{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
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
