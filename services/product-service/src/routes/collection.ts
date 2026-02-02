import { Router, Request, Response, NextFunction } from 'express';
import { CollectionService } from '../services/collection.service';
import { optionalAuth } from '../middleware/auth';

const router: Router = Router();
const collectionService = new CollectionService();

/**
 * GET /api/collections
 * Get all collections
 */
router.get('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const country = (req.query.country as 'IN' | 'AE' | 'UK') || 'IN';
    const collections = await collectionService.getCollections(country);

    res.json({
      success: true,
      data: collections,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/collections/:id
 * Get collection details
 */
router.get('/:id', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const country = (req.query.country as 'IN' | 'AE' | 'UK') || 'IN';
    const collection = await collectionService.getCollection(req.params.id, country);

    res.json({
      success: true,
      data: collection,
    });
  } catch (error) {
    next(error);
  }
});

export { router as collectionRouter };
