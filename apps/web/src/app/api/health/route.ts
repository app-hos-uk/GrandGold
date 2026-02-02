import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SERVICES = [
  { name: 'auth', url: process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:4001' },
  { name: 'order', url: process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'http://localhost:4004' },
  { name: 'product', url: process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || 'http://localhost:4007' },
  { name: 'ai', url: process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:4009' },
];

/**
 * GET /api/health
 * Aggregate health check for all backend services
 */
export async function GET() {
  const results: Record<string, { status: string; latency?: number; error?: string }> = {};

  await Promise.all(
    SERVICES.map(async ({ name, url }) => {
      const start = Date.now();
      try {
        const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(5000) });
        const latency = Date.now() - start;
        results[name] = res.ok ? { status: 'healthy', latency } : { status: 'unhealthy', latency };
      } catch (err) {
        results[name] = { status: 'unreachable', error: err instanceof Error ? err.message : 'Unknown' };
      }
    })
  );

  const allHealthy = Object.values(results).every((r) => r.status === 'healthy');
  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: results,
    },
    { status: allHealthy ? 200 : 503 }
  );
}
