window.config = {
  routerBasename: '/',
  showStudyList: true,

  workflowApi: {
    baseUrl: 'http://localhost:5255',
  },

  dashboard: {
    useMockData: false,
    timeZone: 'Africa/Kampala',
  },

  whiteLabeling: {
    createLogoComponentFn: function (React) {
      return React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            maxWidth: '620px',
          },
        },
        React.createElement(
          'a',
          {
            href: '/dashboard',
            target: '_self',
            'aria-label': 'Go to MSWNH PACS dashboard',
            style: { display: 'flex', textDecoration: 'none' },
          },
          React.createElement('img', {
            src: '/hospital-logo.svg',
            alt: 'Mulago Specialised Women and Neonatal Hospital',
            style: {
              height: '42px',
              width: 'auto',
              objectFit: 'contain',
            },
          })
        ),
        React.createElement(
          'a',
          {
            href: '/dashboard',
            target: '_self',
            style: {
              color: '#ffffff',
              fontSize: '17px',
              fontWeight: '600',
              letterSpacing: '0.4px',
              lineHeight: '1.2',
              whiteSpace: 'nowrap',
              textDecoration: 'none',
            },
          },
          'MSWNH PACS'
        )
      );
    },
  },

  showWarningMessageForCrossOrigin: false,
  showCPUFallbackMessage: true,
  showLoadingIndicator: true,
  investigationalUseDialog: {
    option: 'never',
  },

  defaultDataSourceName: 'dicomweb',

  dataSources: [
    {
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',

      configuration: {
        friendlyName: 'MSWNH Development PACS',
        name: 'PACS_ARCHIVE',

        qidoRoot: 'http://localhost:8080/dcm4chee-arc/aets/PACS_ARCHIVE/rs',

        wadoRoot: 'http://localhost:8080/dcm4chee-arc/aets/PACS_ARCHIVE/rs',

        wadoUriRoot: 'http://localhost:8080/dcm4chee-arc/aets/PACS_ARCHIVE/wado',

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

      redirect_uri: 'http://localhost:3001/callback',
      post_logout_redirect_uri: 'http://localhost:3001/logout-redirect.html',

      response_type: 'code',
      scope: 'openid profile email',

      useAuthorizationCodeFlow: true,
    },
  ],

  /*
  oidc: [
    {
      authority: 'https://auth.pacs.test/realms/PACS',
      client_id: 'ohif-viewer',

      redirect_uri: 'https://viewer.pacs.test/callback',
      post_logout_redirect_uri: 'https://viewer.pacs.test/logout-redirect.html',

      response_type: 'code',
      scope: 'openid profile email',

      useAuthorizationCodeFlow: true,
      automaticSilentRenew: true,
      revokeAccessTokenOnSignout: true,
    },
  ],
  */
  extensions: [],
  modes: [],

  maxNumberOfWebWorkers: 3,

  maxNumRequests: {
    interaction: 100,
    thumbnail: 75,
    prefetch: 25,
  },
};
