import { Router, Request, Response } from 'express';
import type { Country } from '@grandgold/types';
import { getStores } from '../lib/click-collect-stores';

const router = Router();

/** Generate time slots for next 7 days */
function getTimeSlots(_storeId: string): { date: string; slots: string[] }[] {
  const slots = ['10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
  const result: { date: string; slots: string[] }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    result.push({
      date: d.toISOString().slice(0, 10),
      slots,
    });
  }
  return result;
}

/**
 * GET /api/click-collect/stores?country=IN
 */
router.get('/stores', async (req: Request, res: Response) => {
  try {
    const country = ((req.query.country as string)?.toUpperCase() as Country) || 'IN';
    const list = await getStores(country);
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch stores' } });
  }
});

/**
 * GET /api/click-collect/stores/:storeId/slots
 */
router.get('/stores/:storeId/slots', (req: Request, res: Response) => {
  const slots = getTimeSlots(req.params.storeId);
  res.json({ success: true, data: slots });
});

export { router as clickCollectRouter };
