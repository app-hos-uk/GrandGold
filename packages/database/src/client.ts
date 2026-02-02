import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Connection string from environment
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/grandgold_dev';

// Create postgres client
const client = postgres(connectionString, {
  max: 10, // connection pool size
  idle_timeout: 20,
  connect_timeout: 10,
});

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
