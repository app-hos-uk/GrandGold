import { Router, Request, Response } from 'express';
import type { Country } from '@grandgold/types';

const router = Router();

/** Available consultation slots for next 7 days */
const SLOT_TIMES = ['10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];

function getConsultationSlots(): { date: string; slots: string[] }[] {
  const result: { date: string; slots: string[] }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    result.push({
      date: d.toISOString().slice(0, 10),
      slots: SLOT_TIMES,
    });
  }
  return result;
}

// In-memory store for consultation bookings and signaling (use Redis in production)
const bookings = new Map<string, { date: string; slot: string; country: Country; userId?: string }>();
const signals = new Map<string, { type: string; data: unknown }[]>();

function generateRoomId(): string {
  return `room-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * GET /api/consultation/slots?country=IN
 */
router.get('/slots', (req: Request, res: Response) => {
  const slots = getConsultationSlots();
  res.json({ success: true, data: slots });
});

/**
 * POST /api/consultation/book
 * Body: { date, slot, country, userId? }
 */
router.post('/book', (req: Request, res: Response) => {
  const { date, slot, country = 'IN', userId } = req.body;
  if (!date || !slot) {
    res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'date and slot required' } });
    return;
  }

  const roomId = generateRoomId();
  bookings.set(roomId, { date, slot, country: country as Country, userId });

  res.json({
    success: true,
    data: {
      roomId,
      date,
      slot,
      message: `Consultation booked for ${date} at ${slot}. Share the room link to start the video call.`,
    },
  });
});

/**
 * GET /api/consultation/room/:roomId
 */
router.get('/room/:roomId', (req: Request, res: Response) => {
  const { roomId } = req.params;
  const booking = bookings.get(roomId);
  if (!booking) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Room not found' } });
    return;
  }
  res.json({ success: true, data: { roomId, ...booking } });
});

/**
 * POST /api/consultation/room/:roomId/signal
 * Body: { type: 'offer'|'answer'|'ice', data }
 */
router.post('/room/:roomId/signal', (req: Request, res: Response) => {
  const { roomId } = req.params;
  const { type, data } = req.body;
  if (!bookings.has(roomId)) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Room not found' } });
    return;
  }
  const list = signals.get(roomId) ?? [];
  list.push({ type, data });
  signals.set(roomId, list);
  res.json({ success: true });
});

/**
 * GET /api/consultation/room/:roomId/signal?after=0
 * Poll for new WebRTC signals (offer, answer, ice). Client polls every 1–2s.
 */
router.get('/room/:roomId/signal', (req: Request, res: Response) => {
  const { roomId } = req.params;
  const after = parseInt(req.query.after as string) || 0;

  if (!bookings.has(roomId)) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Room not found' } });
    return;
  }

  const list = signals.get(roomId) ?? [];
  const newSignals = list.slice(after);
  res.json({ success: true, data: { signals: newSignals, index: list.length } });
});

export { router as consultationRouter };
