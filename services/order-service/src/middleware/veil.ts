import { Request, Response, NextFunction } from 'express';
import type { OrderStatus } from '@grandgold/types';
import { VeilService } from '../services/veil.service';

const veilService = new VeilService();

/**
 * Metadata stripping middleware
 * Prevents "inspect element" leakage of seller data
 * Applies VeilService.sanitizeResponse to API responses
 */
export function veilResponseMiddleware(_revealLevel: 'none' | 'partial' | 'full' = 'none') {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res.json = function (body: any) {
      if (body && typeof body === 'object' && body.data) {
        const context = {
          stage: ((req as Request & { checkoutStage?: string }).checkoutStage || 'browsing') as 'browsing',
          userRole: (req as Request & { user?: { role?: string } }).user?.role,
          orderStatus: body.data?.status as OrderStatus | undefined,
        };
        const level = veilService.shouldRevealSeller(context);
        body.data = veilService.sanitizeResponse(body.data, level);
      }
      return originalJson(body);
    };
    
    next();
  };
}
