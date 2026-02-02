import axios from 'axios';
import { generateId, ValidationError } from '@grandgold/utils';

interface PayPalOrder {
  id: string;
  status: string;
  links: { href: string; rel: string; method: string }[];
}

export class PayPalService {
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.clientId = process.env.PAYPAL_CLIENT_ID || '';
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
    this.baseUrl =
      process.env.PAYPAL_ENV === 'production'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';
  }

  /**
   * Get access token
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(
              `${this.clientId}:${this.clientSecret}`
            ).toString('base64')}`,
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + response.data.expires_in * 1000);

      return this.accessToken!;
    } catch (error) {
      throw new ValidationError('Failed to get PayPal access token');
    }
  }

  /**
   * Create PayPal order
   */
  async createOrder(input: {
    amount: number;
    currency: string;
    orderId: string;
    returnUrl: string;
    cancelUrl: string;
  }): Promise<PayPalOrder> {
    const accessToken = await this.getAccessToken();

    try {
      const response = await axios.post(
        `${this.baseUrl}/v2/checkout/orders`,
        {
          intent: 'CAPTURE',
          purchase_units: [
            {
              reference_id: input.orderId,
              amount: {
                currency_code: input.currency,
                value: input.amount.toFixed(2),
              },
            },
          ],
          application_context: {
            return_url: input.returnUrl,
            cancel_url: input.cancelUrl,
            brand_name: 'GrandGold',
            landing_page: 'BILLING',
            user_action: 'PAY_NOW',
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      throw new ValidationError('Failed to create PayPal order');
    }
  }

  /**
   * Capture PayPal payment
   */
  async capturePayment(orderId: string): Promise<any> {
    const accessToken = await this.getAccessToken();

    try {
      const response = await axios.post(
        `${this.baseUrl}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      throw new ValidationError('Failed to capture PayPal payment');
    }
  }

  /**
   * Get order details
   */
  async getOrder(orderId: string): Promise<any> {
    const accessToken = await this.getAccessToken();

    try {
      const response = await axios.get(
        `${this.baseUrl}/v2/checkout/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      throw new ValidationError('Failed to get PayPal order');
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(captureId: string, amount?: number, currency?: string): Promise<any> {
    const accessToken = await this.getAccessToken();

    try {
      const refundData: any = {};
      if (amount && currency) {
        refundData.amount = {
          value: amount.toFixed(2),
          currency_code: currency,
        };
      }

      const response = await axios.post(
        `${this.baseUrl}/v2/payments/captures/${captureId}/refund`,
        refundData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      throw new ValidationError('Failed to refund PayPal payment');
    }
  }
}
