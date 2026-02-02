export default ({ env }: { env: { (k: string, d?: string): string; int: (k: string, d?: number) => number; array: (k: string, d?: string[]) => string[]; bool: (k: string, d?: boolean) => boolean } }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('PUBLIC_URL', 'http://localhost:1337'),
  app: {
    keys: env.array('APP_KEYS', ['grandgold-key-1', 'grandgold-key-2']),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
});
