/**
 * Order SLA enforcement cron.
 *
 * Runs periodically and detects orders that have been stuck in a
 * particular status beyond the configurable SLA window.  When a
 * breach is found, an internal notification is pushed to admin
 * users and the order is flagged.
 */
import cron from 'node-cron';
import pino from 'pino';
import { addNotification } from '../lib/notification-store';

const logger = pino({ name: 'order-sla-cron' });

// ── Configurable SLA thresholds (hours) by seller tier ─────────────
export const SLA_THRESHOLDS: Record<string, Record<string, number>> = {
  // Default thresholds (hours) per status
  default: {
    confirmed: 48,   // Order should move to processing within 48h
    processing: 48,  // Order should be shipped within 48h of processing
    shipped: 168,    // Delivery expected within 7 days of shipping
  },
  platinum: {
    confirmed: 24,
    processing: 24,
    shipped: 120,
  },
  gold: {
    confirmed: 36,
    processing: 36,
    shipped: 144,
  },
};

interface OrderRecord {
  id: string;
  orderNumber: string;
  status: string;
  country: string;
  sellerId?: string;
  sellerTier?: string;
  customerId: string;
  confirmedAt?: Date;
  updatedAt: Date;
  slaBreached?: boolean;
  slaBreachedAt?: Date;
}

// In-memory store reference (same store the order service uses)
// In production this would be a database query
let orderStoreRef: Map<string, OrderRecord> | null = null;

export function setOrderStoreRef(store: Map<string, OrderRecord>): void {
  orderStoreRef = store;
}

function getThresholdHours(sellerTier: string | undefined, status: string): number {
  const tier = sellerTier && SLA_THRESHOLDS[sellerTier] ? sellerTier : 'default';
  return SLA_THRESHOLDS[tier][status] ?? 48;
}

async function runOrderSlaCheck(): Promise<void> {
  if (!orderStoreRef) {
    logger.warn('Order store not available — skipping SLA check');
    return;
  }

  const now = Date.now();
  const monitoredStatuses = ['confirmed', 'processing', 'shipped'];
  let breachCount = 0;

  for (const order of orderStoreRef.values()) {
    if (!monitoredStatuses.includes(order.status)) continue;
    if (order.slaBreached) continue; // Already flagged

    const statusTimestamp = order.confirmedAt ?? order.updatedAt;
    if (!statusTimestamp) continue;

    const hoursInStatus = (now - new Date(statusTimestamp).getTime()) / (1000 * 60 * 60);
    const thresholdHours = getThresholdHours(order.sellerTier, order.status);

    if (hoursInStatus > thresholdHours) {
      // Flag the order
      order.slaBreached = true;
      order.slaBreachedAt = new Date();

      breachCount++;

      // Push notification to admin users (the notification store broadcasts)
      const statusLabel = order.status.charAt(0).toUpperCase() + order.status.slice(1);
      addNotification('admin_sla_alerts', {
        type: 'order',
        title: `SLA Breach: Order ${order.orderNumber}`,
        body: `Order has been in "${statusLabel}" for ${Math.round(hoursInStatus)}h (SLA: ${thresholdHours}h). Country: ${order.country}.`,
        link: `/admin/orders?highlight=${order.id}`,
      }).catch(() => {});

      logger.warn(
        { orderId: order.id, status: order.status, hoursInStatus: Math.round(hoursInStatus), threshold: thresholdHours },
        'Order SLA breached'
      );
    }
  }

  if (breachCount > 0) {
    logger.info({ breachCount }, 'SLA check completed — breaches detected');
  }
}

/**
 * Start order SLA cron. Runs every 30 minutes.
 * Set ORDER_SLA_CRON_ENABLED=false to disable.
 */
export function startOrderSlaCron(): void {
  const enabled = process.env.ORDER_SLA_CRON_ENABLED !== 'false';
  if (!enabled) {
    logger.info('Order SLA cron disabled');
    return;
  }

  cron.schedule('*/30 * * * *', runOrderSlaCheck, {
    scheduled: true,
    timezone: 'UTC',
  });
  logger.info('Order SLA cron started (every 30 min)');

  // Run once on startup (after 3 min delay)
  setTimeout(runOrderSlaCheck, 3 * 60 * 1000);
}
