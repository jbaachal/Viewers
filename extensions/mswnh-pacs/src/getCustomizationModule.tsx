import React from 'react';

import { DashboardRoute } from './dashboard/routes/DashboardRoute';

export default function getCustomizationModule() {
  return [
    {
      name: 'default',
      value: {
        'routes.customRoutes': {
          routes: {
            $push: [
              {
                path: '/dashboard',
                private: true,
                children: (props: any) => (
                  <DashboardRoute
                    page="dashboard"
                    servicesManager={props.servicesManager}
                  />
                ),
              },
              {
                path: '/worklist',
                private: true,
                children: (props: any) => (
                  <DashboardRoute
                    page="worklist"
                    servicesManager={props.servicesManager}
                  />
                ),
              },
              {
                path: '/dashboard/management',
                private: true,
                children: (props: any) => (
                  <DashboardRoute
                    page="management"
                    servicesManager={props.servicesManager}
                  />
                ),
              },
              {
                path: '/dashboard/system',
                private: true,
                children: (props: any) => (
                  <DashboardRoute
                    page="system"
                    servicesManager={props.servicesManager}
                  />
                ),
              },
            ],
          },
        },
      },
    },
  ];
}
