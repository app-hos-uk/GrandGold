import { StripeService } from './stripe.service';
import { RazorpayService } from './razorpay.service';

const stripeService = new StripeService();
const razorpayService = new RazorpayService();

// Payment event handlers
const eventHandlers: Record<string, (data: any) => Promise<void>> = {};

export class WebhookService {
  /**
   * Handle Stripe webhook
   */
  async handleStripeWebhook(rawBody: Buffer, signature: string): Promise<void> {
    const event = stripeService.verifyWebhookSignature(rawBody, signature);
    
    if (!event) {
      throw new Error('Invalid webhook signature');
    }
    
    console.log(`Stripe webhook received: ${event.type}`);
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess({
          gateway: 'stripe',
          paymentId: event.data.object.id,
          amount: event.data.object.amount,
          currency: event.data.object.currency,
          metadata: event.data.object.metadata,
        });
        break;
        
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure({
          gateway: 'stripe',
          paymentId: event.data.object.id,
          error: event.data.object.last_payment_error?.message,
        });
        break;
        
      case 'charge.refunded':
        await this.handleRefund({
          gateway: 'stripe',
          refundId: event.data.object.id,
          paymentId: event.data.object.payment_intent as string,
          amount: event.data.object.amount_refunded,
        });
        break;
        
      case 'charge.dispute.created':
        await this.handleDispute({
          gateway: 'stripe',
          disputeId: event.data.object.id,
          paymentId: event.data.object.payment_intent as string,
          amount: event.data.object.amount,
          reason: event.data.object.reason,
        });
        break;
    }
  }

  /**
   * Handle Razorpay webhook
   */
  async handleRazorpayWebhook(payload: any, signature: string): Promise<void> {
    const isValid = razorpayService.verifyWebhookSignature(
      JSON.stringify(payload),
      signature
    );
    
    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }
    
    console.log(`Razorpay webhook received: ${payload.event}`);
    
    switch (payload.event) {
      case 'payment.captured':
        await this.handlePaymentSuccess({
          gateway: 'razorpay',
          paymentId: payload.payload.payment.entity.id,
          orderId: payload.payload.payment.entity.order_id,
          amount: payload.payload.payment.entity.amount,
          currency: payload.payload.payment.entity.currency,
          method: payload.payload.payment.entity.method,
        });
        break;
        
      case 'payment.failed':
        await this.handlePaymentFailure({
          gateway: 'razorpay',
          paymentId: payload.payload.payment.entity.id,
          error: payload.payload.payment.entity.error_description,
        });
        break;
        
      case 'refund.processed':
        await this.handleRefund({
          gateway: 'razorpay',
          refundId: payload.payload.refund.entity.id,
          paymentId: payload.payload.refund.entity.payment_id,
          amount: payload.payload.refund.entity.amount,
        });
        break;
        
      case 'order.paid':
        await this.handleOrderPaid({
          orderId: payload.payload.order.entity.id,
          amount: payload.payload.order.entity.amount_paid,
        });
        break;
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSuccess(data: {
    gateway: string;
    paymentId: string;
    orderId?: string;
    amount: number;
    currency?: string;
    method?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    console.log('Payment success:', data);
    
    // Update order status
    // Send confirmation email
    // Notify seller
    // Update inventory
    
    // In production, publish event to message queue
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailure(data: {
    gateway: string;
    paymentId: string;
    error?: string;
  }): Promise<void> {
    console.log('Payment failed:', data);
    
    // Update order status
    // Send failure email
    // Release inventory hold
  }

  /**
   * Handle refund
   */
  private async handleRefund(data: {
    gateway: string;
    refundId: string;
    paymentId: string;
    amount: number;
  }): Promise<void> {
    console.log('Refund processed:', data);
    
    // Update order status
    // Send refund confirmation email
    // Update seller ledger
  }

  /**
   * Handle dispute
   */
  private async handleDispute(data: {
    gateway: string;
    disputeId: string;
    paymentId: string;
    amount: number;
    reason?: string;
  }): Promise<void> {
    console.log('Dispute created:', data);
    
    // Alert admin
    // Hold seller funds
    // Create support ticket
  }

  /**
   * Handle Razorpay order paid
   */
  private async handleOrderPaid(data: {
    orderId: string;
    amount: number;
  }): Promise<void> {
    console.log('Razorpay order paid:', data);
    
    // Verify order and update status
  }
}
