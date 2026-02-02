import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import axios from 'axios';
import { describeImageForSearch } from '../services/vertex.service';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:4007';

router.post(
  '/',
  upload.single('image'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = req.file;
      const country = (req.body.country as string) || 'IN';

      if (!file || !file.buffer) {
        res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'image file is required' },
        });
        return;
      }

      const base64 = file.buffer.toString('base64');
      const mimeType = file.mimetype || 'image/jpeg';

      const searchQuery = await describeImageForSearch(base64, mimeType);

      const searchUrl = `${PRODUCT_SERVICE_URL}/api/search?q=${encodeURIComponent(searchQuery)}&country=${country}&limit=10`;
      const searchRes = await axios.get(searchUrl, { timeout: 5000 });

      const payload = searchRes.data?.data;
      const products = Array.isArray(payload) ? payload : payload?.data ?? [];
      const results = Array.isArray(products)
        ? products.slice(0, 10).map((p: { id: string; name?: string; category?: string; price?: number }) => ({
            id: p.id,
            name: p.name || 'Product',
            category: p.category || 'Jewelry',
            price: p.price ?? 0,
          }))
        : [];

      res.json({ success: true, data: { results, query: searchQuery } });
    } catch (err) {
      next(err);
    }
  }
);

export { router as visualSearchRouter };
