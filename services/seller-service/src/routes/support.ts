import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '@grandgold/utils';
import { SupportService } from '../services/support.service';
import { authenticate, requireSeller, authorize } from '../middleware/auth';

const router = Router();
const supportService = new SupportService();

// Create ticket schema
const createTicketSchema = z.object({
  subject: z.string().min(1).max(200),
  category: z.enum(['technical', 'billing', 'product', 'account', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  description: z.string().min(10),
  attachments: z.array(z.string().url()).optional(),
});

/**
 * POST /api/sellers/support/tickets
 * Create a support ticket
 */
router.post('/tickets', authenticate, requireSeller, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const data = createTicketSchema.parse(req.body);
    const sellerId = req.user.sub; // In production, get actual seller ID

    const ticket = await supportService.createTicket({
      sellerId,
      ...data,
    });

    res.status(201).json({
      success: true,
      data: ticket,
      message: 'Support ticket created',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError('Validation failed', { errors: error.errors }));
    } else {
      next(error);
    }
  }
});

/**
 * GET /api/sellers/support/tickets
 * Get seller's tickets
 */
router.get('/tickets', authenticate, requireSeller, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const sellerId = req.user.sub;
    const status = req.query.status as string;
    const category = req.query.category as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const tickets = await supportService.getSellerTickets(sellerId, {
      status,
      category,
      page,
      limit,
    });

    res.json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sellers/support/tickets/:ticketId
 * Get ticket details
 */
router.get('/tickets/:ticketId', authenticate, requireSeller, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const sellerId = req.user.sub;
    const ticket = await supportService.getTicket(req.params.ticketId, sellerId);

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sellers/support/tickets/:ticketId/messages
 * Add message to ticket
 */
router.post('/tickets/:ticketId/messages', authenticate, requireSeller, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const sellerId = req.user.sub;
    const { message, attachments } = req.body;

    const ticketMessage = await supportService.addMessage(
      req.params.ticketId,
      sellerId,
      message,
      attachments
    );

    res.json({
      success: true,
      data: ticketMessage,
      message: 'Message added',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/sellers/support/tickets/:ticketId/status
 * Update ticket status
 */
router.patch('/tickets/:ticketId/status', authenticate, requireSeller, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const sellerId = req.user.sub;
    const { status } = req.body;

    const ticket = await supportService.updateTicketStatus(
      req.params.ticketId,
      sellerId,
      status
    );

    res.json({
      success: true,
      data: ticket,
      message: 'Ticket status updated',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sellers/support/statistics
 * Get ticket statistics
 */
router.get('/statistics', authenticate, requireSeller, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const sellerId = req.user.sub;
    const stats = await supportService.getTicketStatistics(sellerId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

// Admin routes

/**
 * GET /api/sellers/support/admin/tickets
 * Get all tickets (Admin)
 */
router.get(
  '/admin/tickets',
  authenticate,
  authorize('super_admin', 'country_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = req.query.status as string;
      const priority = req.query.priority as string;
      const category = req.query.category as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const tickets = await supportService.getAllTickets({
        status,
        priority,
        category,
        page,
        limit,
      });

      res.json({
        success: true,
        data: tickets,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/sellers/support/admin/tickets/:ticketId/assign
 * Assign ticket to agent (Admin)
 */
router.post(
  '/admin/tickets/:ticketId/assign',
  authenticate,
  authorize('super_admin', 'country_admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { agentId } = req.body;

      const ticket = await supportService.assignTicket(req.params.ticketId, agentId);

      res.json({
        success: true,
        data: ticket,
        message: 'Ticket assigned',
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as supportRouter };
