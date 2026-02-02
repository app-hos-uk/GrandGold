export default ({ env }: { env: (k: string, d?: string) => string }) => ({
  // GraphQL plugin for frontend integration
  graphql: {
    config: {
      endpoint: '/graphql',
      shadowCRUD: true,
      playgroundAlways: env('NODE_ENV') !== 'production',
      depthLimit: 10,
      amountLimit: 100,
      apolloServer: {
        tracing: false,
        introspection: true,
      },
    },
  },
  // Internationalization for multi-region support
  i18n: {
    config: {
      defaultLocale: 'en',
      locales: ['en', 'ar', 'hi'],
    },
  },
  // Upload provider for media
  upload: {
    config: {
      provider: env('UPLOAD_PROVIDER', 'local'),
      providerOptions: {},
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  },
});
