import { Router, Request, Response, NextFunction, IRouter } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';

const router: IRouter = Router();

// In-memory stores for demo (in production, use database)
const campaignsStore: Map<string, Campaign> = new Map();
const segmentsStore: Map<string, Segment> = new Map();

// Initialize some demo data
const demoSegments: Segment[] = [
  { id: 's1', name: 'High-value buyers (₹1L+)', criteria: { minLTV: 100000 }, count: 1250, lastUpdated: new Date().toISOString() },
  { id: 's2', name: 'Abandoned cart (7 days)', criteria: { cartAbandoned: true, days: 7 }, count: 890, lastUpdated: new Date().toISOString() },
  { id: 's3', name: 'Wishlist non-buyers', criteria: { hasWishlist: true, noPurchase: 30 }, count: 2100, lastUpdated: new Date().toISOString() },
  { id: 's4', name: 'India - Gold lovers', criteria: { country: 'IN', category: 'gold' }, count: 5600, lastUpdated: new Date().toISOString() },
];
demoSegments.forEach((s) => segmentsStore.set(s.id, s));

const demoCampaigns: Campaign[] = [
  { id: 'c1', name: 'Diwali Gold Sale', channel: 'email', status: 'sent', subject: 'Special Diwali Gold Offers', content: 'Check out our exclusive Diwali collection', segmentId: 's4', recipients: 12500, sentAt: '2024-01-15', openRate: 32, clickRate: 8, createdAt: new Date().toISOString() },
  { id: 'c2', name: 'New Arrivals - Necklaces', channel: 'email', status: 'scheduled', subject: 'New Arrivals Just For You', content: 'Discover our latest necklace collection', recipients: 8500, scheduledAt: '2024-02-10', createdAt: new Date().toISOString() },
  { id: 'c3', name: 'Abandoned Cart Reminder', channel: 'whatsapp', status: 'sent', content: 'You left something in your cart!', segmentId: 's2', recipients: 3200, sentAt: '2024-01-20', openRate: 78, createdAt: new Date().toISOString() },
  { id: 'c4', name: 'Price Drop Alert', channel: 'push', status: 'draft', content: 'Prices dropped on your wishlist items!', recipients: 0, createdAt: new Date().toISOString() },
];
demoCampaigns.forEach((c) => campaignsStore.set(c.id, c));

interface Campaign {
  id: string;
  name: string;
  channel: 'email' | 'whatsapp' | 'push' | 'sms';
  status: 'draft' | 'scheduled' | 'sending' | 'sent';
  subject?: string;
  content: string;
  segmentId?: string;
  recipients: number;
  sentAt?: string;
  scheduledAt?: string;
  openRate?: number;
  clickRate?: number;
  createdAt: string;
}

interface Segment {
  id: string;
  name: string;
  criteria: Record<string, unknown>;
  count: number;
  lastUpdated: string;
}

const createCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  channel: z.enum(['email', 'whatsapp', 'push', 'sms']),
  subject: z.string().max(200).optional(),
  content: z.string().min(1),
  segmentId: z.string().optional(),
  scheduledAt: z.string().optional(),
});

const createSegmentSchema = z.object({
  name: z.string().min(1).max(200),
  criteria: z.record(z.unknown()),
});

/**
 * GET /api/marketing/campaigns
 * List campaigns
 */
router.get('/campaigns', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const status = req.query.status as string;
    const channel = req.query.channel as string;

    let campaigns = Array.from(campaignsStore.values());

    if (status) {
      campaigns = campaigns.filter((c) => c.status === status);
    }
    if (channel) {
      campaigns = campaigns.filter((c) => c.channel === channel);
    }

    // Sort by most recent
    campaigns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const start = (page - 1) * limit;
    const paginated = campaigns.slice(start, start + limit);

    res.json({
      success: true,
      data: paginated,
      total: campaigns.length,
      page,
      limit,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/marketing/campaigns/:id
 * Get single campaign
 */
router.get('/campaigns/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const campaign = campaignsStore.get(id);

    if (!campaign) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Campaign not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/marketing/campaigns
 * Create new campaign
 */
router.post('/campaigns', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createCampaignSchema.parse(req.body);

    const campaign: Campaign = {
      id: randomUUID(),
      name: data.name,
      channel: data.channel,
      status: data.scheduledAt ? 'scheduled' : 'draft',
      subject: data.subject,
      content: data.content,
      segmentId: data.segmentId,
      recipients: data.segmentId ? (segmentsStore.get(data.segmentId)?.count || 0) : 0,
      scheduledAt: data.scheduledAt,
      createdAt: new Date().toISOString(),
    };

    campaignsStore.set(campaign.id, campaign);

    res.status(201).json({
      success: true,
      data: campaign,
      message: 'Campaign created',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: error.errors },
      });
    } else {
      next(error);
    }
  }
});

/**
 * PATCH /api/marketing/campaigns/:id
 * Update campaign
 */
router.patch('/campaigns/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const campaign = campaignsStore.get(id);

    if (!campaign) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Campaign not found' },
      });
      return;
    }

    const updateData = req.body;
    Object.assign(campaign, updateData);
    campaignsStore.set(id, campaign);

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/marketing/campaigns/:id/send
 * Send campaign now
 */
router.post('/campaigns/:id/send', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const campaign = campaignsStore.get(id);

    if (!campaign) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Campaign not found' },
      });
      return;
    }

    if (campaign.status === 'sent') {
      res.status(400).json({
        success: false,
        error: { code: 'ALREADY_SENT', message: 'Campaign was already sent' },
      });
      return;
    }

    // In production: queue the campaign for sending
    campaign.status = 'sending';
    campaign.sentAt = new Date().toISOString();
    campaignsStore.set(id, campaign);

    // Simulate async sending
    setTimeout(() => {
      campaign.status = 'sent';
      campaign.openRate = Math.floor(Math.random() * 30) + 20;
      campaign.clickRate = Math.floor(Math.random() * 10) + 5;
      campaignsStore.set(id, campaign);
    }, 5000);

    res.json({
      success: true,
      data: campaign,
      message: 'Campaign is being sent',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/marketing/campaigns/:id
 * Delete campaign
 */
router.delete('/campaigns/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    if (!campaignsStore.has(id)) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Campaign not found' },
      });
      return;
    }

    campaignsStore.delete(id);

    res.json({
      success: true,
      message: 'Campaign deleted',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/marketing/segments
 * List segments
 */
router.get('/segments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const segments = Array.from(segmentsStore.values());
    segments.sort((a, b) => b.count - a.count);

    const start = (page - 1) * limit;
    const paginated = segments.slice(start, start + limit);

    res.json({
      success: true,
      data: paginated,
      total: segments.length,
      page,
      limit,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/marketing/segments/:id
 * Get single segment
 */
router.get('/segments/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const segment = segmentsStore.get(id);

    if (!segment) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Segment not found' },
      });
      return;
    }

    res.json({
      success: true,
      data: segment,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/marketing/segments
 * Create new segment
 */
router.post('/segments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createSegmentSchema.parse(req.body);

    const segment: Segment = {
      id: randomUUID(),
      name: data.name,
      criteria: data.criteria,
      count: 0, // In production: calculate based on criteria
      lastUpdated: new Date().toISOString(),
    };

    // Simulate count calculation
    segment.count = Math.floor(Math.random() * 5000) + 500;

    segmentsStore.set(segment.id, segment);

    res.status(201).json({
      success: true,
      data: segment,
      message: 'Segment created',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: error.errors },
      });
    } else {
      next(error);
    }
  }
});

/**
 * POST /api/marketing/segments/:id/refresh
 * Refresh segment count
 */
router.post('/segments/:id/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const segment = segmentsStore.get(id);

    if (!segment) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Segment not found' },
      });
      return;
    }

    // In production: recalculate count based on criteria
    segment.count = Math.floor(Math.random() * 5000) + 500;
    segment.lastUpdated = new Date().toISOString();
    segmentsStore.set(id, segment);

    res.json({
      success: true,
      data: segment,
      message: 'Segment refreshed',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/marketing/segments/:id
 * Delete segment
 */
router.delete('/segments/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    if (!segmentsStore.has(id)) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Segment not found' },
      });
      return;
    }

    segmentsStore.delete(id);

    res.json({
      success: true,
      message: 'Segment deleted',
    });
  } catch (error) {
    next(error);
  }
});

export { router as marketingRouter };
