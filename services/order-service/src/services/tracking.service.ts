// In-memory store for demo
const trackingStore = new Map<string, TrackingRecord>();

interface TrackingEvent {
  status: string;
  location: string;
  timestamp: Date;
  description: string;
}

interface TrackingRecord {
  orderId: string;
  carrier?: string;
  trackingNumber?: string;
  status?: string;
  currentLocation?: string;
  lastUpdate?: Date;
  estimatedDelivery?: Date;
  events: TrackingEvent[];
  [key: string]: unknown;
}

interface TrackingUpdate {
  carrier: string;
  trackingNumber: string;
  status: string;
  location: string;
  timestamp: string;
  description: string;
  signature?: string;
}

export class TrackingService {
  /**
   * Get tracking for an order
   */
  async getTracking(orderId: string, _userId: string): Promise<TrackingRecord> {
    // Mock tracking data
    return {
      orderId,
      orderNumber: 'GG-IN-20250201-000001',
      status: 'in_transit',
      carrier: 'DHL Express',
      trackingNumber: 'DHL1234567890',
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      currentLocation: 'Mumbai Hub',
      lastUpdate: new Date(),
      events: [
        {
          status: 'picked_up',
          location: 'Seller Warehouse, Delhi',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          description: 'Package picked up',
        },
        {
          status: 'in_transit',
          location: 'Delhi Airport',
          timestamp: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000),
          description: 'Package departed facility',
        },
        {
          status: 'in_transit',
          location: 'Mumbai Hub',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
          description: 'Package arrived at hub',
        },
      ],
      isSecuredShipment: true,
      insuranceAmount: 150000,
    };
  }

  /**
   * Get tracking by tracking number
   */
  async getTrackingByNumber(trackingNumber: string): Promise<Record<string, unknown>> {
    // In production, call carrier API
    return {
      trackingNumber,
      carrier: 'DHL Express',
      status: 'in_transit',
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      events: [
        {
          status: 'in_transit',
          location: 'Mumbai Hub',
          timestamp: new Date(),
          description: 'Package in transit',
        },
      ],
    };
  }

  /**
   * Update tracking (from carrier webhook)
   */
  async updateTracking(orderId: string, data: TrackingUpdate): Promise<void> {
    // Verify webhook signature (mock)
    const signatureValid = true;
    
    if (!signatureValid) {
      throw new Error('Invalid webhook signature');
    }
    
    const tracking = trackingStore.get(orderId) || {
      orderId,
      events: [],
    };
    
    tracking.carrier = data.carrier;
    tracking.trackingNumber = data.trackingNumber;
    tracking.status = data.status;
    tracking.lastUpdate = new Date(data.timestamp);
    tracking.currentLocation = data.location;
    
    tracking.events.push({
      status: data.status,
      location: data.location,
      timestamp: new Date(data.timestamp),
      description: data.description,
    });
    
    trackingStore.set(orderId, tracking);
    
    // Trigger notifications based on status
    await this.handleStatusChange(orderId, data.status);
  }

  /**
   * Get full tracking timeline
   */
  async getTimeline(orderId: string, userId: string): Promise<Record<string, unknown>[]> {
    const tracking = await this.getTracking(orderId, userId);
    
    // Build comprehensive timeline including order events
    const timeline = [
      {
        type: 'order',
        status: 'order_placed',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        description: 'Order placed successfully',
        icon: 'shopping_bag',
      },
      {
        type: 'order',
        status: 'payment_confirmed',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        description: 'Payment confirmed',
        icon: 'payment',
      },
      {
        type: 'order',
        status: 'processing',
        timestamp: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000),
        description: 'Order is being processed',
        icon: 'settings',
      },
      ...tracking.events.map((event: TrackingEvent) => ({
        type: 'shipping',
        status: event.status,
        timestamp: event.timestamp,
        description: event.description,
        location: event.location,
        icon: this.getStatusIcon(event.status),
      })),
    ];
    
    return timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  /**
   * Get estimated delivery
   */
  async getEstimatedDelivery(orderId: string, userId: string): Promise<{
    estimatedDate: Date;
    estimatedTimeRange: string;
    confidence: 'high' | 'medium' | 'low';
    factors: string[];
  }> {
    const tracking = await this.getTracking(orderId, userId);
    
    return {
      estimatedDate: tracking.estimatedDelivery ?? new Date(),
      estimatedTimeRange: '10:00 AM - 6:00 PM',
      confidence: 'high',
      factors: [
        'Weather conditions are favorable',
        'No holiday delays expected',
        'Package is on schedule',
      ],
    };
  }

  /**
   * Handle status change and trigger notifications
   */
  private async handleStatusChange(orderId: string, status: string): Promise<void> {
    // Status-based notifications
    const notifications: Record<string, { title: string; message: string }> = {
      picked_up: {
        title: 'Order Picked Up',
        message: 'Your order has been picked up and is on its way!',
      },
      in_transit: {
        title: 'Order In Transit',
        message: 'Your order is on its way to you.',
      },
      out_for_delivery: {
        title: 'Out for Delivery',
        message: 'Your order is out for delivery today!',
      },
      delivered: {
        title: 'Order Delivered',
        message: 'Your order has been delivered. Enjoy!',
      },
      delivery_failed: {
        title: 'Delivery Attempt Failed',
        message: 'Delivery was attempted but unsuccessful. We will try again.',
      },
    };
    
    const notification = notifications[status];
    if (notification) {
      // In production, send push notification, email, SMS, WhatsApp
      console.log(`Notification: ${notification.title} - ${notification.message}`);
    }
  }

  private getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      picked_up: 'local_shipping',
      in_transit: 'flight',
      out_for_delivery: 'delivery_dining',
      delivered: 'check_circle',
      delivery_failed: 'error',
    };
    
    return icons[status] || 'info';
  }
}
