export default ({ env }: { env: { (k: string, d?: string): string; bool: (k: string, d?: boolean) => boolean } }) => {
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.ADMIN_JWT_SECRET) throw new Error('FATAL: ADMIN_JWT_SECRET is required in production');
    if (!process.env.API_TOKEN_SALT) throw new Error('FATAL: API_TOKEN_SALT is required in production');
    if (!process.env.TRANSFER_TOKEN_SALT) throw new Error('FATAL: TRANSFER_TOKEN_SALT is required in production');
  }

  return {
    auth: {
      secret: env('ADMIN_JWT_SECRET', 'dev-only-cms-jwt-DO-NOT-USE-IN-PRODUCTION'),
    },
    apiToken: {
      salt: env('API_TOKEN_SALT', 'dev-only-api-salt-DO-NOT-USE-IN-PRODUCTION'),
    },
    transfer: {
      token: {
        salt: env('TRANSFER_TOKEN_SALT', 'dev-only-transfer-salt-DO-NOT-USE-IN-PRODUCTION'),
      },
    },
    flags: {
      nps: env.bool('FLAG_NPS', true),
      promoteEE: env.bool('FLAG_PROMOTE_EE', true),
    },
  };
};
