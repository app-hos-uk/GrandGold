import { Router, Request, Response, NextFunction } from 'express';
import { SessionService } from '../services/session.service';
import { authenticate } from '../middleware/auth';

const router = Router();
const sessionService = new SessionService();

// All session routes require authentication
router.use(authenticate);

/**
 * GET /api/sessions
 * Get all active sessions for current user
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not found');
    }
    
    const sessions = await sessionService.getUserSessions(req.user.sub);
    
    // Mark current session
    // const authHeader = req.headers.authorization;
    // const currentToken = authHeader?.split(' ')[1]; // TODO: use for proper session matching
    
    const sessionsWithCurrent = sessions.map(session => ({
      ...session,
      isCurrent: session.id === req.user?.sub, // This would need proper matching
    }));
    
    res.json({
      success: true,
      data: sessionsWithCurrent,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/sessions/:id
 * Revoke a specific session
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not found');
    }
    
    await sessionService.revokeSession(req.user.sub, req.params.id);
    
    res.json({
      success: true,
      message: 'Session revoked successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/sessions
 * Revoke all sessions except current
 */
router.delete('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not found');
    }
    
    const authHeader = req.headers.authorization;
    const currentToken = authHeader?.split(' ')[1];
    
    await sessionService.revokeAllExceptCurrent(req.user.sub, currentToken || '');
    
    res.json({
      success: true,
      message: 'All other sessions revoked',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sessions/activity
 * Get recent activity log
 */
router.get('/activity', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error('User not found');
    }
    
    const limit = parseInt(req.query.limit as string) || 20;
    const activities = await sessionService.getActivityLog(req.user.sub, limit);
    
    res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
});

export { router as sessionRouter };
