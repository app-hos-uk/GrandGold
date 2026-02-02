import { Request, Response, NextFunction } from 'express';
import { VeilService } from '../services/veil.service';

const veilService = new VeilService();

/**
 * Metadata stripping middleware
 * Prevents "inspect element" leakage of seller data
 * Applies VeilService.sanitizeResponse to API responses
 */
export function veilResponseMiddleware(revealLevel: 'none' | 'partial' | 'full' = 'none') {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    
    res.json = function (body: any) {
      if (body && typeof body === 'object' && body.data) {
        const context = {
          stage: (req as any).checkoutStage || 'browsing',
          userRole: (req as any).user?.role,
          orderStatus: body.data?.status,
        };
        const level = veilService.shouldRevealSeller(context);
        body.data = veilService.sanitizeResponse(body.data, level);
      }
      return originalJson(body);
    };
    
    next();
  };
}
