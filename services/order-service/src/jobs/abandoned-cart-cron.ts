import cron from 'node-cron';
import pino from 'pino';
import { AbandonedCartService } from '../services/abandoned-cart.service';
import {
  sendAbandonedCartReminder,
  buildCheckoutUrl,
} from '../lib/notifications';

const logger = pino({ name: 'abandoned-cart-cron' });
const abandonedCartService = new AbandonedCartService();

async function runAbandonedCartJob(): Promise<void> {
  try {
    // 1. Detect and record newly abandoned carts
    const recorded = await abandonedCartService.detectAndRecordAbandonedCarts();
    if (recorded > 0) {
      logger.info({ recorded }, 'Recorded abandoned carts');
    }

    // 2. Send 1h reminders
    const for1h = await abandonedCartService.getCartsForReminder('1h');
    for (const record of for1h) {
      await sendAbandonedCartReminder({
        email: record.email,
        phone: record.phone,
        cartId: record.cartId,
        items: record.items,
        subtotal: record.subtotal,
        currency: record.currency,
        country: record.country,
        checkoutUrl: buildCheckoutUrl(record.country, record.cartId),
      });
      await abandonedCartService.markReminderSent(record.cartId, '1h');
      logger.info({ cartId: record.cartId }, 'Sent 1h abandoned cart reminder');
    }

    // 3. Send 24h reminders
    const for24h = await abandonedCartService.getCartsForReminder('24h');
    for (const record of for24h) {
      await sendAbandonedCartReminder({
        email: record.email,
        phone: record.phone,
        cartId: record.cartId,
        items: record.items,
        subtotal: record.subtotal,
        currency: record.currency,
        country: record.country,
        checkoutUrl: buildCheckoutUrl(record.country, record.cartId),
      });
      await abandonedCartService.markReminderSent(record.cartId, '24h');
      logger.info({ cartId: record.cartId }, 'Sent 24h abandoned cart reminder');
    }

    // 4. Send 72h reminders
    const for72h = await abandonedCartService.getCartsForReminder('72h');
    for (const record of for72h) {
      await sendAbandonedCartReminder({
        email: record.email,
        phone: record.phone,
        cartId: record.cartId,
        items: record.items,
        subtotal: record.subtotal,
        currency: record.currency,
        country: record.country,
        checkoutUrl: buildCheckoutUrl(record.country, record.cartId),
      });
      await abandonedCartService.markReminderSent(record.cartId, '72h');
      logger.info({ cartId: record.cartId }, 'Sent 72h abandoned cart reminder');
    }
  } catch (err) {
    logger.error({ err }, 'Abandoned cart cron job failed');
  }
}

/**
 * Start abandoned cart cron. Runs every 15 minutes.
 * Set ABANDONED_CART_CRON_ENABLED=false to disable.
 */
export function startAbandonedCartCron(): void {
  const enabled = process.env.ABANDONED_CART_CRON_ENABLED !== 'false';
  if (!enabled) {
    logger.info('Abandoned cart cron disabled');
    return;
  }

  cron.schedule('*/15 * * * *', runAbandonedCartJob, {
    scheduled: true,
    timezone: 'UTC',
  });
  logger.info('Abandoned cart cron started (every 15 min)');

  // Run once on startup (after 2 min delay to let services warm up)
  setTimeout(runAbandonedCartJob, 2 * 60 * 1000);
}
