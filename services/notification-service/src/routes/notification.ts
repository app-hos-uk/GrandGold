import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const router = Router();

// Send email (placeholder - wire to Resend/SendGrid)
const sendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
  templateId: z.string().optional(),
  data: z.record(z.unknown()).optional(),
});

router.post('/send/email', (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = sendEmailSchema.parse(req.body);
    // TODO: Resend/SendGrid integration
    // await emailProvider.send(payload);
    res.json({ success: true, data: { id: `email-${Date.now()}`, status: 'queued' } });
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { message: 'Validation failed', details: e.errors } });
      return;
    }
    next(e);
  }
});

// Send WhatsApp (placeholder - wire to WhatsApp Business API)
const sendWhatsAppSchema = z.object({
  to: z.string().min(10),
  template: z.string().min(1),
  language: z.string().optional(),
  components: z.array(z.unknown()).optional(),
});

router.post('/send/whatsapp', (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = sendWhatsAppSchema.parse(req.body);
    // TODO: WhatsApp Business API
    res.json({ success: true, data: { id: `wa-${Date.now()}`, status: 'queued' } });
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { message: 'Validation failed', details: e.errors } });
      return;
    }
    next(e);
  }
});

// Send SMS (placeholder - wire to Twilio/MSG91)
const sendSMSSchema = z.object({
  to: z.string().min(10),
  body: z.string().min(1).max(1600),
});

router.post('/send/sms', (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = sendSMSSchema.parse(req.body);
    // TODO: Twilio/MSG91
    res.json({ success: true, data: { id: `sms-${Date.now()}`, status: 'queued' } });
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { message: 'Validation failed', details: e.errors } });
      return;
    }
    next(e);
  }
});

// Preferences (opt-in/opt-out)
router.get('/preferences/:userId', (req: Request, res: Response) => {
  // TODO: load from DB
  res.json({
    success: true,
    data: {
      email: true,
      whatsapp: false,
      sms: false,
      push: true,
      marketing: false,
    },
  });
});

router.patch('/preferences/:userId', (req: Request, res: Response) => {
  // TODO: save to DB
  res.json({ success: true, data: req.body });
});

export { router as notificationRouter };
