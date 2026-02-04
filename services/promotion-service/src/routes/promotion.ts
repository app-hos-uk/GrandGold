import { Router, Request, Response, NextFunction } from 'express';
import { PromotionService } from '../services/promotion.service';

const router: Router = Router();
const promotionService = new PromotionService();

// Validate coupon (public - for checkout)
router.post('/validate', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, subtotal, country, userId } = req.body;
    if (!code || subtotal == null) {
      res.status(400).json({ success: false, error: { message: 'code and subtotal required' } });
      return;
    }
    const result = promotionService.validateCoupon(code, Number(subtotal), country || 'IN', userId);
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
});

// --- Coupons (admin) ---
router.get('/coupons', (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const status = req.query.status as string;
    const country = req.query.country as string;
    const result = promotionService.listCoupons({ page, limit, status, country });
    res.json({ success: true, data: result?.data ?? [], total: result?.total ?? 0 });
  } catch {
    res.status(200).json({ success: true, data: [], total: 0 });
  }
});

router.get('/coupons/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupon = promotionService.getCoupon(req.params.id);
    if (!coupon) {
      res.status(404).json({ success: false, error: { message: 'Coupon not found' } });
      return;
    }
    res.json({ success: true, data: coupon });
  } catch (e) {
    next(e);
  }
});

router.post('/coupons', (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupon = promotionService.createCoupon(req.body);
    res.status(201).json({ success: true, data: coupon });
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes('already exists')) {
      res.status(409).json({ success: false, error: { message: e.message } });
      return;
    }
    next(e);
  }
});

router.patch('/coupons/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupon = promotionService.updateCoupon(req.params.id, req.body);
    res.json({ success: true, data: coupon });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Coupon not found') {
      res.status(404).json({ success: false, error: { message: e.message } });
      return;
    }
    next(e);
  }
});

router.delete('/coupons/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    promotionService.deleteCoupon(req.params.id);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Coupon not found') {
      res.status(404).json({ success: false, error: { message: e.message } });
      return;
    }
    next(e);
  }
});

// --- Automatic discounts (admin) ---
router.get('/automatic', (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const country = req.query.country as string;
    const result = promotionService.listAutomaticDiscounts({ page, limit, country });
    res.json({ success: true, data: result?.data ?? [], total: result?.total ?? 0 });
  } catch {
    res.status(200).json({ success: true, data: [], total: 0 });
  }
});

router.post('/automatic', (req: Request, res: Response, next: NextFunction) => {
  try {
    const discount = promotionService.createAutomaticDiscount(req.body);
    res.status(201).json({ success: true, data: discount });
  } catch (e) {
    next(e);
  }
});

router.patch('/automatic/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const discount = promotionService.updateAutomaticDiscount(req.params.id, req.body);
    res.json({ success: true, data: discount });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Automatic discount not found') {
      res.status(404).json({ success: false, error: { message: e.message } });
      return;
    }
    next(e);
  }
});

router.delete('/automatic/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    promotionService.deleteAutomaticDiscount(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Automatic discount not found') {
      res.status(404).json({ success: false, error: { message: e.message } });
      return;
    }
    next(e);
  }
});

// --- Flash sales (admin) ---
router.get('/flash-sales', (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const activeOnly = req.query.activeOnly === 'true';
    const result = promotionService.listFlashSales({ page, limit, activeOnly });
    res.json({ success: true, data: result?.data ?? [], total: result?.total ?? 0 });
  } catch {
    res.status(200).json({ success: true, data: [], total: 0 });
  }
});

router.post('/flash-sales', (req: Request, res: Response, next: NextFunction) => {
  try {
    const sale = promotionService.createFlashSale(req.body);
    res.status(201).json({ success: true, data: sale });
  } catch (e) {
    next(e);
  }
});

router.patch('/flash-sales/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const sale = promotionService.updateFlashSale(req.params.id, req.body);
    res.json({ success: true, data: sale });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Flash sale not found') {
      res.status(404).json({ success: false, error: { message: e.message } });
      return;
    }
    next(e);
  }
});

router.delete('/flash-sales/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    promotionService.deleteFlashSale(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'Flash sale not found') {
      res.status(404).json({ success: false, error: { message: e.message } });
      return;
    }
    next(e);
  }
});

export { router as promotionRouter };
