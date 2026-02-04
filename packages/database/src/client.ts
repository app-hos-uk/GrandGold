import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Connection string from environment
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/grandgold_dev';

// Cloud SQL connection name for Unix socket (e.g. project:region:instance)
// When set, we connect via /cloudsql/PROJECT:REGION:INSTANCE socket
const cloudSqlConnection = process.env.CLOUD_SQL_CONNECTION_NAME;

// Cloud SQL (and some managed Postgres) may use certs that Node doesn't verify by default.
// Set DATABASE_SSL_NO_VERIFY=1 only when needed (e.g. Cloud Run → Cloud SQL public IP).
const sslOption = process.env.DATABASE_SSL_NO_VERIFY === '1' ? { rejectUnauthorized: false } : true;

/**
 * Parse DATABASE_URL to extract credentials (for Unix socket connections).
 * Returns { username, password, database } or null if parsing fails.
 */
function parseConnectionString(url: string): { username: string; password: string; database: string } | null {
  try {
    // Format: postgresql://user:password@host:port/database
    const match = url.match(/^postgres(?:ql)?:\/\/([^:]+):([^@]+)@[^/]+\/(.+)$/);
    if (match) {
      return { username: match[1], password: match[2], database: match[3].split('?')[0] };
    }
    return null;
  } catch {
    return null;
  }
}

// Build postgres options
function buildPostgresOptions(): postgres.Options<Record<string, postgres.PostgresType>> {
  const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  
  const options: postgres.Options<Record<string, postgres.PostgresType>> = {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 30,
    ssl: isLocalhost ? false : (cloudSqlConnection ? false : sslOption),
  };
  
  // If Cloud SQL connection is set, use Unix socket with extracted credentials
  if (cloudSqlConnection) {
    const creds = parseConnectionString(connectionString);
    if (creds) {
      options.host = `/cloudsql/${cloudSqlConnection}`;
      options.username = creds.username;
      options.password = creds.password;
      options.database = creds.database;
      console.log(`[DB] Connecting via Cloud SQL socket: ${options.host} to database: ${creds.database}`);
    } else {
      console.warn('[DB] Could not parse DATABASE_URL for Cloud SQL socket connection');
    }
  }
  
  return options;
}

// Create postgres client
// When using Cloud SQL Unix socket, pass empty string to avoid URL host conflict
const client = cloudSqlConnection 
  ? postgres(buildPostgresOptions())
  : postgres(connectionString, buildPostgresOptions());

// Create drizzle instance
export const db = drizzle(client, { schema });

// Export type for database instance
export type Database = typeof db;

// Health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await client`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Close database connection
export async function closeDatabaseConnection(): Promise<void> {
  await client.end();
}

// Multi-tenant schema switching
export async function setTenantSchema(tenantId: string): Promise<void> {
  await client`SET search_path TO ${client(tenantId)}, public`;
}

export async function resetToPublicSchema(): Promise<void> {
  await client`SET search_path TO public`;
}

// Create tenant schema
export async function createTenantSchema(tenantId: string): Promise<void> {
  await client`CREATE SCHEMA IF NOT EXISTS ${client(tenantId)}`;
}

// Drop tenant schema
export async function dropTenantSchema(tenantId: string): Promise<void> {
  await client`DROP SCHEMA IF EXISTS ${client(tenantId)} CASCADE`;
}
