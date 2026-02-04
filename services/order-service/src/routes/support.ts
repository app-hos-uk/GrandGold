import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { ValidationError, NotFoundError } from '@grandgold/utils';
import { authenticate, authorize } from '../middleware/auth';
import type { UserRole, JwtPayload } from '@grandgold/types';

const router = Router();
const ADMIN_ROLES: UserRole[] = ['super_admin', 'country_admin', 'manager', 'staff'];

// In-memory store for demo (in production, use database)
const ticketsStore: Map<string, SupportTicket> = new Map();
const agentsStore: Map<string, SupportAgent> = new Map();

// Initialize some demo agents
const demoAgents: SupportAgent[] = [
  { id: 'A1', name: 'Rahul Mehta', email: 'rahul@grandgold.com', avatar: 'RM', status: 'online', activeChats: 3, resolvedToday: 12, avgRating: 4.8, role: 'agent' },
  { id: 'A2', name: 'Sarah Khan', email: 'sarah@grandgold.com', avatar: 'SK', status: 'busy', activeChats: 4, resolvedToday: 8, avgRating: 4.9, role: 'agent' },
  { id: 'A3', name: 'John Smith', email: 'john@grandgold.com', avatar: 'JS', status: 'online', activeChats: 1, resolvedToday: 15, avgRating: 4.6, role: 'agent' },
  { id: 'A4', name: 'Priya Patel', email: 'priya@grandgold.com', avatar: 'PP', status: 'away', activeChats: 0, resolvedToday: 10, avgRating: 4.7, role: 'supervisor' },
];
demoAgents.forEach((a) => agentsStore.set(a.id, a));

interface SupportTicket {
  id: string;
  subject: string;
  customer: { id: string; name: string; email: string };
  type: 'order' | 'return' | 'payment' | 'product' | 'account' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed';
  channel: 'chat' | 'email' | 'phone' | 'whatsapp';
  assignee?: { id: string; name: string };
  messages: { id: string; content: string; sender: string; senderType: 'customer' | 'agent' | 'system'; isInternal: boolean; createdAt: string }[];
  relatedOrderId?: string;
  createdAt: string;
  updatedAt: string;
  country: string;
}

interface SupportAgent {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: 'online' | 'busy' | 'away' | 'offline';
  activeChats: number;
  resolvedToday: number;
  avgRating: number;
  role: 'agent' | 'supervisor' | 'manager';
}

const createTicketSchema = z.object({
  subject: z.string().min(1).max(200),
  type: z.enum(['order', 'return', 'payment', 'product', 'account', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  channel: z.enum(['chat', 'email', 'phone', 'whatsapp']).optional().default('chat'),
  message: z.string().min(1),
  relatedOrderId: z.string().optional(),
});

const updateTicketSchema = z.object({
  status: z.enum(['open', 'pending', 'in_progress', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assigneeId: z.string().optional(),
});

/**
 * GET /api/support/tickets
 * List tickets (admin/agent)
 */
router.get(
  '/tickets',
  authenticate,
  authorize(...ADMIN_ROLES),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const status = req.query.status as string;
      const priority = req.query.priority as string;
      const assignee = req.query.assignee as string;

      let tickets = Array.from(ticketsStore.values());

      // Filter
      if (status) {
        tickets = tickets.filter((t) => t.status === status);
      }
      if (priority) {
        tickets = tickets.filter((t) => t.priority === priority);
      }
      if (assignee) {
        tickets = tickets.filter((t) => t.assignee?.id === assignee);
      }

      // Sort by most recent
      tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Paginate
      const start = (page - 1) * limit;
      const paginated = tickets.slice(start, start + limit);

      // Calculate stats
      const allTickets = Array.from(ticketsStore.values());
      const stats = {
        openTickets: allTickets.filter((t) => t.status === 'open').length,
        avgResponseTime: 25, // In production, calculate from actual data
        resolutionRate: 94,
        activeChats: allTickets.filter((t) => t.channel === 'chat' && t.status === 'in_progress').length,
        waitingCustomers: allTickets.filter((t) => t.status === 'open').length,
        aiResolutionRate: 68,
        customerSatisfaction: 4.7,
      };

      res.json({
        success: true,
        data: paginated,
        total: tickets.length,
        page,
        limit,
        stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/support/tickets/:id
 * Get single ticket with messages
 */
router.get(
  '/tickets/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const ticket = ticketsStore.get(id);

      if (!ticket) {
        throw new NotFoundError('Ticket not found');
      }

      // Customers can only see their own tickets
      if (req.user?.role === 'customer' && ticket.customer.id !== req.user.sub) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied' },
        });
        return;
      }

      res.json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/support/tickets
 * Create new support ticket
 */
router.post(
  '/tickets',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createTicketSchema.parse(req.body);

      const userName = req.user!.email.split('@')[0]; // Use email prefix as name
      const ticket: SupportTicket = {
        id: `TKT-${Date.now()}`,
        subject: data.subject,
        customer: {
          id: req.user!.sub,
          name: userName,
          email: req.user!.email,
        },
        type: data.type,
        priority: data.priority || 'medium',
        status: 'open',
        channel: data.channel || 'chat',
        messages: [
          {
            id: randomUUID(),
            content: data.message,
            sender: userName,
            senderType: 'customer' as const,
            isInternal: false,
            createdAt: new Date().toISOString(),
          },
        ],
        relatedOrderId: data.relatedOrderId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        country: req.user!.country || 'IN',
      };

      ticketsStore.set(ticket.id, ticket);

      res.status(201).json({
        success: true,
        data: ticket,
        message: 'Ticket created',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ValidationError('Validation failed', { errors: error.errors }));
      } else {
        next(error);
      }
    }
  }
);

/**
 * PATCH /api/support/tickets/:id
 * Update ticket (admin/agent)
 */
router.patch(
  '/tickets/:id',
  authenticate,
  authorize(...ADMIN_ROLES),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = updateTicketSchema.parse(req.body);

      const ticket = ticketsStore.get(id);
      if (!ticket) {
        throw new NotFoundError('Ticket not found');
      }

      if (data.status) {
        ticket.status = data.status;
      }
      if (data.priority) {
        ticket.priority = data.priority;
      }
      if (data.assigneeId) {
        const agent = agentsStore.get(data.assigneeId);
        if (agent) {
          ticket.assignee = { id: agent.id, name: agent.name };
          if (ticket.status === 'open') {
            ticket.status = 'in_progress';
          }
        }
      }

      ticket.updatedAt = new Date().toISOString();
      ticketsStore.set(id, ticket);

      res.json({
        success: true,
        data: ticket,
        message: 'Ticket updated',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ValidationError('Validation failed', { errors: error.errors }));
      } else {
        next(error);
      }
    }
  }
);

/**
 * POST /api/support/tickets/:id/reply
 * Add reply to ticket
 */
router.post(
  '/tickets/:id/reply',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { content, isInternal } = req.body;

      if (!content || typeof content !== 'string') {
        throw new ValidationError('Content is required');
      }

      const ticket = ticketsStore.get(id);
      if (!ticket) {
        throw new NotFoundError('Ticket not found');
      }

      const isAdmin = req.user?.role && ADMIN_ROLES.includes(req.user.role);

      // Customers can't add internal notes
      if (isInternal && !isAdmin) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Internal notes require admin role' },
        });
        return;
      }

      const senderName = req.user!.email.split('@')[0];
      const message: SupportTicket['messages'][0] = {
        id: randomUUID(),
        content,
        sender: senderName,
        senderType: isAdmin ? 'agent' : 'customer',
        isInternal: isInternal ?? false,
        createdAt: new Date().toISOString(),
      };

      ticket.messages.push(message);
      ticket.updatedAt = new Date().toISOString();

      // If agent replied, update status
      if (isAdmin && ticket.status === 'open') {
        ticket.status = 'in_progress';
      }

      ticketsStore.set(id, ticket);

      res.json({
        success: true,
        data: ticket,
        message: 'Reply added',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/support/agents
 * List support agents (admin)
 */
router.get(
  '/agents',
  authenticate,
  authorize(...ADMIN_ROLES),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const agents = Array.from(agentsStore.values());
      
      res.json({
        success: true,
        data: agents,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/support/agents/:id/status
 * Update agent status
 */
router.patch(
  '/agents/:id/status',
  authenticate,
  authorize(...ADMIN_ROLES),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['online', 'busy', 'away', 'offline'].includes(status)) {
        throw new ValidationError('Invalid status');
      }

      const agent = agentsStore.get(id);
      if (!agent) {
        throw new NotFoundError('Agent not found');
      }

      agent.status = status;
      agentsStore.set(id, agent);

      res.json({
        success: true,
        data: agent,
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as supportRouter };
