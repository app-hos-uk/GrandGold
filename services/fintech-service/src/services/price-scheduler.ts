import cron from 'node-cron';
import pino from 'pino';
import { GoldPriceService } from './gold-price.service';
import { PriceAlertService } from './price-alert.service';
import { broadcastPriceUpdate } from '../websocket';
import type { Country, GoldPurity } from '@grandgold/types';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const COUNTRIES: Country[] = ['IN', 'AE', 'UK'];
const PURITIES: GoldPurity[] = ['24K', '22K', '21K', '18K', '14K', '10K'];

export class PriceScheduler {
  private goldPriceService: GoldPriceService;
  private priceAlertService: PriceAlertService;
  private updateTask: cron.ScheduledTask | null = null;
  private alertCheckTask: cron.ScheduledTask | null = null;

  constructor() {
    this.goldPriceService = new GoldPriceService();
    this.priceAlertService = new PriceAlertService();
  }

  /**
   * Start the price scheduler
   */
  start(): void {
    logger.info('Starting price scheduler...');

    // Update prices every minute
    this.updateTask = cron.schedule('* * * * *', async () => {
      await this.updatePrices();
    });

    // Check alerts every 30 seconds
    this.alertCheckTask = cron.schedule('*/30 * * * * *', async () => {
      await this.checkAlerts();
    });

    // Initial update
    this.updatePrices();

    logger.info('Price scheduler started');
  }

  /**
   * Stop the price scheduler
   */
  stop(): void {
    logger.info('Stopping price scheduler...');

    if (this.updateTask) {
      this.updateTask.stop();
    }

    if (this.alertCheckTask) {
      this.alertCheckTask.stop();
    }

    logger.info('Price scheduler stopped');
  }

  /**
   * Update gold prices for all countries
   */
  private async updatePrices(): Promise<void> {
    try {
      logger.debug('Updating gold prices...');

      // Get spot price
      const spotPrice = await this.goldPriceService.getSpotPrice();

      // Store as fallback
      await this.goldPriceService.storeAsFallback(spotPrice);

      // Update prices for each country
      for (const country of COUNTRIES) {
        const prices = await this.goldPriceService.getCurrentPrices(country);

        // Broadcast update via WebSocket
        broadcastPriceUpdate({
          type: 'price_update',
          country,
          prices: prices.prices,
          currency: prices.currency,
          spotPriceUsd: prices.spotPriceUsd,
          timestamp: new Date().toISOString(),
        });
      }

      logger.debug('Gold prices updated successfully');
    } catch (error) {
      logger.error({ error }, 'Failed to update gold prices');
    }
  }

  /**
   * Check price alerts
   */
  private async checkAlerts(): Promise<void> {
    try {
      for (const country of COUNTRIES) {
        const prices = await this.goldPriceService.getCurrentPrices(country);

        for (const purity of PURITIES) {
          const currentPrice = prices.prices[purity];
          const triggeredAlerts = await this.priceAlertService.checkAlerts(
            country,
            purity,
            currentPrice
          );

          // Send notifications for triggered alerts
          for (const alert of triggeredAlerts) {
            await this.sendAlertNotification(alert, currentPrice);
          }
        }
      }
    } catch (error) {
      logger.error({ error }, 'Failed to check price alerts');
    }
  }

  /**
   * Send notification for triggered alert
   */
  private async sendAlertNotification(
    alert: {
      id: string;
      userId: string;
      targetPrice: number;
      direction: string;
      purity: GoldPurity;
      country: Country;
      notificationChannels: string[];
    },
    currentPrice: number
  ): Promise<void> {
    const message = `Gold price alert! ${alert.purity} gold is now ${alert.direction === 'above' ? 'above' : 'below'} your target of ${alert.targetPrice}. Current price: ${currentPrice}`;

    logger.info({ alertId: alert.id, userId: alert.userId, currentPrice }, 'Sending price alert notification');

    for (const channel of alert.notificationChannels) {
      switch (channel) {
        case 'email':
          // TODO: Send email notification
          logger.debug({ alertId: alert.id }, 'Would send email notification');
          break;
        case 'push':
          // TODO: Send push notification
          logger.debug({ alertId: alert.id }, 'Would send push notification');
          break;
        case 'whatsapp':
          // TODO: Send WhatsApp notification
          logger.debug({ alertId: alert.id }, 'Would send WhatsApp notification');
          break;
      }
    }
  }
}
