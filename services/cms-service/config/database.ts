import path from 'path';
import os from 'os';
import fs from 'fs';

export default ({ env }: { env: { (k: string, d?: string): string; int: (k: string, d?: number) => number; bool: (k: string, d?: boolean) => boolean } }) => {
  const client = env('DATABASE_CLIENT', 'sqlite') as 'postgres' | 'sqlite';

  const sqlitePath = env('DATABASE_FILENAME') || path.join(os.homedir(), '.grandgold-cms', 'dev.db');
  if (client === 'sqlite' && !env('DATABASE_FILENAME')) {
    const dir = path.dirname(sqlitePath);
    fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
  }

  const connections: Record<string, object> = {
    postgres: {
      connection: {
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'grandgold_cms'),
        user: env('DATABASE_USERNAME', 'postgres'),
        password: env('DATABASE_PASSWORD', 'password'),
        ssl: env.bool('DATABASE_SSL', false) && {
          rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', true),
        },
      },
      pool: {
        min: env.int('DATABASE_POOL_MIN', 2),
        max: env.int('DATABASE_POOL_MAX', 10),
      },
    },
    sqlite: {
      connection: {
        filename: path.isAbsolute(sqlitePath) ? sqlitePath : path.join(__dirname, '..', sqlitePath),
        options: { readonly: false },
      },
      useNullAsDefault: true,
    },
  };

  return {
    connection: {
      client,
      ...connections[client],
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
    },
  };
};
