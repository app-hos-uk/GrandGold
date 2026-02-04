import { defineConfig } from 'drizzle-kit';

const url = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/grandgold_dev';
if (/\.\.\.|@(HOST|USER|PASSWORD|DATABASE)([:/]|$)/i.test(url)) {
  console.error('DATABASE_URL must be your real PostgreSQL connection string.');
  console.error('Do not use placeholders like "...", "HOST", "USER", "PASSWORD", or "DATABASE".');
  console.error('Example (local): DATABASE_URL="postgresql://postgres:password@localhost:5432/grandgold_dev" pnpm db:push');
  process.exit(1);
}

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  driver: 'pg',
  dbCredentials: {
    connectionString: url,
  },
  verbose: true,
  strict: true,
});
