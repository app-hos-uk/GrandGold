import { Router, Request, Response, NextFunction, IRouter } from 'express';
import { z } from 'zod';
import { Resend } from 'resend';

const router: IRouter = Router();

// ── Email Provider (Resend) ─────────────────────────────────────────────
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const EMAIL_FROM = process.env.EMAIL_FROM || 'GrandGold <noreply@grandgold.com>';

const sendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
  templateId: z.string().optional(),
  data: z.record(z.unknown()).optional(),
});

router.post('/send/email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = sendEmailSchema.parse(req.body);

    if (resend) {
      const { data, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to: payload.to,
        subject: payload.subject,
        html: payload.body,
      });
      if (error) {
        console.error('[EMAIL] Resend error:', error);
        res.status(500).json({ success: false, error: { message: 'Email send failed', details: error } });
        return;
      }
      res.json({ success: true, data: { id: data?.id, status: 'sent', provider: 'resend' } });
    } else {
      // Demo mode when RESEND_API_KEY is not set
      console.log(`[EMAIL-DEMO] To: ${payload.to} | Subject: ${payload.subject}`);
      res.json({ success: true, data: { id: `email-${Date.now()}`, status: 'queued', provider: 'demo' } });
    }
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { message: 'Validation failed', details: e.errors } });
      return;
    }
    next(e);
  }
});

// ── SMS Provider (HTTP-based — works with Twilio, MSG91, etc.) ─────────
const SMS_API_URL = process.env.SMS_API_URL;       // e.g. https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json
const SMS_API_KEY = process.env.SMS_API_KEY;         // Auth token / API key
const SMS_FROM    = process.env.SMS_FROM || 'GrandGold';

const sendSMSSchema = z.object({
  to: z.string().min(10),
  body: z.string().min(1).max(1600),
});

router.post('/send/sms', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = sendSMSSchema.parse(req.body);

    if (SMS_API_URL && SMS_API_KEY) {
      // Generic HTTP POST to SMS gateway
      const smsRes = await fetch(SMS_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SMS_API_KEY}`,
        },
        body: JSON.stringify({ to: payload.to, body: payload.body, from: SMS_FROM }),
      });
      const smsData = await smsRes.json().catch(() => ({}));
      res.json({ success: true, data: { id: (smsData as Record<string, string>).sid || `sms-${Date.now()}`, status: 'sent', provider: 'sms-gateway' } });
    } else {
      console.log(`[SMS-DEMO] To: ${payload.to} | Body: ${payload.body.slice(0, 60)}`);
      res.json({ success: true, data: { id: `sms-${Date.now()}`, status: 'queued', provider: 'demo' } });
    }
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { message: 'Validation failed', details: e.errors } });
      return;
    }
    next(e);
  }
});

// ── WhatsApp (placeholder — wire to WhatsApp Business API / Twilio) ────
const sendWhatsAppSchema = z.object({
  to: z.string().min(10),
  template: z.string().min(1),
  language: z.string().optional(),
  components: z.array(z.unknown()).optional(),
});

router.post('/send/whatsapp', (req: Request, res: Response, next: NextFunction) => {
  try {
    sendWhatsAppSchema.parse(req.body);
    // WhatsApp Business API requires approval — keep as demo for now
    res.json({ success: true, data: { id: `wa-${Date.now()}`, status: 'queued', provider: 'demo' } });
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { message: 'Validation failed', details: e.errors } });
      return;
    }
    next(e);
  }
});

// ── Notification preference persistence (Redis-backed) ──────────────────
const PREFS_PREFIX = 'notif_prefs:';

interface NotificationPrefs {
  email: boolean;
  whatsapp: boolean;
  sms: boolean;
  push: boolean;
  marketing: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  email: true,
  whatsapp: false,
  sms: false,
  push: true,
  marketing: false,
};

// Lazy Redis init (same pattern used by other services)
import Redis from 'ioredis';

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }
  return redis;
}

async function loadPrefs(userId: string): Promise<NotificationPrefs> {
  try {
    const raw = await getRedis().get(`${PREFS_PREFIX}${userId}`);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    // Redis unavailable — return defaults
  }
  return { ...DEFAULT_PREFS };
}

async function savePrefs(userId: string, prefs: Partial<NotificationPrefs>): Promise<NotificationPrefs> {
  const current = await loadPrefs(userId);
  const merged: NotificationPrefs = { ...current, ...prefs };
  try {
    await getRedis().set(
      `${PREFS_PREFIX}${userId}`,
      JSON.stringify(merged),
      'EX',
      365 * 86400, // 1 year TTL
    );
  } catch {
    // Redis unavailable — preference will still be returned in-memory
  }
  return merged;
}

// Preferences (opt-in/opt-out) — persisted in Redis
router.get('/preferences/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prefs = await loadPrefs(req.params.userId);
    res.json({ success: true, data: prefs });
  } catch (e) {
    next(e);
  }
});

router.patch('/preferences/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const allowedKeys: (keyof NotificationPrefs)[] = ['email', 'whatsapp', 'sms', 'push', 'marketing'];
    const patch: Partial<NotificationPrefs> = {};
    for (const key of allowedKeys) {
      if (typeof req.body[key] === 'boolean') {
        patch[key] = req.body[key];
      }
    }
    const updated = await savePrefs(req.params.userId, patch);
    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
});

export { router as notificationRouter };
