import { Router, Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { authenticate, authorize } from '../middleware/auth';
import type { UserRole } from '@grandgold/types';

const router = Router();
const ADMIN_ROLES: UserRole[] = ['super_admin', 'country_admin'];

// Audit log interface
interface AuditLog {
  id: string;
  timestamp: string;
  actor: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  action: string;
  category: string;
  resource: {
    type: string;
    id: string;
    name?: string;
  };
  details: string;
  status: 'success' | 'failed' | 'warning';
  ip: string;
  userAgent: string;
  country?: string;
}

// In-memory store for audit logs (in production, use database)
const auditLogsStore: Map<string, AuditLog> = new Map();

// Initialize demo audit logs
const demoLogs: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    actor: { id: 'u1', name: 'Super Admin', email: 'mail@jsabu.com', role: 'super_admin' },
    action: 'user.role_changed',
    category: 'users',
    resource: { type: 'user', id: 'u5', name: 'John Doe' },
    details: 'Changed role from "customer" to "country_admin" for country IN',
    status: 'success',
    ip: '182.73.192.xx',
    userAgent: 'Chrome 120 / macOS',
    country: 'IN',
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    actor: { id: 'u1', name: 'Super Admin', email: 'mail@jsabu.com', role: 'super_admin' },
    action: 'settings.updated',
    category: 'settings',
    resource: { type: 'settings', id: 'payments' },
    details: 'Updated Stripe API configuration',
    status: 'success',
    ip: '182.73.192.xx',
    userAgent: 'Chrome 120 / macOS',
    country: 'IN',
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    actor: { id: 'u2', name: 'Country Admin', email: 'admin@example.com', role: 'country_admin' },
    action: 'auth.login',
    category: 'auth',
    resource: { type: 'session', id: 'sess-123' },
    details: 'Admin logged in successfully',
    status: 'success',
    ip: '103.85.xx.xx',
    userAgent: 'Chrome 120 / Windows',
    country: 'IN',
  },
  {
    id: 'log-4',
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    actor: { id: 'sys', name: 'System', email: 'system@grandgold.com', role: 'system' },
    action: 'security.2fa_disabled',
    category: 'security',
    resource: { type: 'user', id: 'u10', name: 'Suspicious User' },
    details: '2FA was disabled for user account',
    status: 'warning',
    ip: 'N/A',
    userAgent: 'N/A',
  },
  {
    id: 'log-5',
    timestamp: new Date(Date.now() - 18000000).toISOString(),
    actor: { id: 'u2', name: 'Country Admin', email: 'admin@example.com', role: 'country_admin' },
    action: 'order.refund_processed',
    category: 'orders',
    resource: { type: 'order', id: 'ORD-2024-1234' },
    details: 'Refund of ₹25,000 processed for customer',
    status: 'success',
    ip: '103.85.xx.xx',
    userAgent: 'Chrome 120 / Windows',
    country: 'IN',
  },
];

// Initialize demo data
demoLogs.forEach((log) => auditLogsStore.set(log.id, log));

/**
 * GET /api/audit-logs
 * List audit logs (admin only)
 */
router.get(
  '/',
  authenticate,
  authorize(...ADMIN_ROLES),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        page = '1',
        limit = '50',
        category,
        actor,
        startDate,
        endDate,
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = Math.min(parseInt(limit as string, 10), 100);
      const skip = (pageNum - 1) * limitNum;

      let logs = Array.from(auditLogsStore.values());

      // Filter by category
      if (category && typeof category === 'string') {
        logs = logs.filter((l) => l.category === category);
      }

      // Filter by actor
      if (actor && typeof actor === 'string') {
        logs = logs.filter((l) => l.actor.id === actor || l.actor.email.includes(actor));
      }

      // Filter by date range
      if (startDate && typeof startDate === 'string') {
        const start = new Date(startDate);
        logs = logs.filter((l) => new Date(l.timestamp) >= start);
      }
      if (endDate && typeof endDate === 'string') {
        const end = new Date(endDate);
        logs = logs.filter((l) => new Date(l.timestamp) <= end);
      }

      // Country restriction for country admins
      if (req.user?.role === 'country_admin' && req.user?.country) {
        logs = logs.filter((l) => l.country === req.user?.country || !l.country);
      }

      // Sort by timestamp (newest first)
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const total = logs.length;

      // Paginate
      const paginated = logs.slice(skip, skip + limitNum);

      res.json({
        success: true,
        data: paginated,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/audit-logs/:id
 * Get single audit log (admin only)
 */
router.get(
  '/:id',
  authenticate,
  authorize(...ADMIN_ROLES),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const log = auditLogsStore.get(id);
      if (!log) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Audit log not found' },
        });
        return;
      }

      // Country restriction
      if (
        req.user?.role === 'country_admin' &&
        log.country &&
        log.country !== req.user?.country
      ) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied' },
        });
        return;
      }

      res.json({ success: true, data: log });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Helper function to create audit log entries (for use by other services)
 */
export async function createAuditLog(params: {
  actor: AuditLog['actor'];
  action: string;
  category: string;
  resource: AuditLog['resource'];
  details: string;
  status?: AuditLog['status'];
  ip: string;
  userAgent: string;
  country?: string;
}): Promise<AuditLog> {
  const log: AuditLog = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    actor: params.actor,
    action: params.action,
    category: params.category,
    resource: params.resource,
    details: params.details,
    status: params.status || 'success',
    ip: params.ip,
    userAgent: params.userAgent,
    country: params.country,
  };

  auditLogsStore.set(log.id, log);
  return log;
}

export { router as auditLogsRouter };
