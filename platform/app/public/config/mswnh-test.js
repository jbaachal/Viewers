/** Local authenticated MSWNH PACS configuration. */
window.config = {
  routerBasename: '/',
  showStudyList: true,
  showWarningMessageForCrossOrigin: false,
  showCPUFallbackMessage: true,
  showLoadingIndicator: true,
  maxNumberOfWebWorkers: 3,
  workflowApi: {
    baseUrl: 'http://localhost:5255',
  },
  dashboard: {
    useMockData: false,
    timeZone: 'Africa/Kampala',
  },
  extensions: [],
  modes: [],
  defaultDataSourceName: 'dicomweb',
  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        friendlyName: 'MSWNH Development PACS',
        name: 'PACS_ARCHIVE',
        wadoUriRoot: 'http://localhost:8080/dcm4chee-arc/aets/PACS_ARCHIVE/wado',
        qidoRoot: 'http://localhost:8080/dcm4chee-arc/aets/PACS_ARCHIVE/rs',
        wadoRoot: 'http://localhost:8080/dcm4chee-arc/aets/PACS_ARCHIVE/rs',
        qidoSupportsIncludeField: true,
        supportsReject: true,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: true,
        supportsWildcard: true,
      },
    },
  ],
  oidc: [
    {
      authority: 'http://localhost:8180/realms/PACS',
      client_id: 'ohif-viewer',
      redirect_uri: 'http://localhost:3000/callback',
      post_logout_redirect_uri: 'http://localhost:3000/logout-redirect.html',
      response_type: 'code',
      scope: 'openid profile email',
      useAuthorizationCodeFlow: true,
      automaticSilentRenew: true,
    },
  ],
};
