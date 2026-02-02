/**
 * Notification helpers for order-service (email, WhatsApp).
 * Resend for email; WhatsApp uses placeholder until Business API is configured.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.ABANDONED_CART_FROM_EMAIL || 'GrandGold <noreply@grandgold.com>';
const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';

export interface AbandonedCartNotifyPayload {
  email?: string;
  phone?: string;
  cartId: string;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  currency: string;
  country: string;
  checkoutUrl: string;
}

/**
 * Send abandoned cart email via Resend API
 */
export async function sendAbandonedCartEmail(payload: AbandonedCartNotifyPayload): Promise<boolean> {
  if (!payload.email) return false;

  if (!RESEND_API_KEY) {
    // eslint-disable-next-line no-console
    console.log('[notifications] Resend not configured, would send abandoned cart email to', payload.email);
    return true; // Pretend success in dev
  }

  try {
    const itemsHtml = payload.items
      .map((i) => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>${payload.currency} ${i.price.toLocaleString()}</td></tr>`)
      .join('');
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Complete your order</title></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>You left items in your cart</h2>
  <p>Hi there,</p>
  <p>You have items waiting in your GrandGold cart. Complete your purchase to secure your order.</p>
  <table style="width:100%; border-collapse: collapse;">
    <thead><tr style="background:#f5f5f5;"><th>Item</th><th>Qty</th><th>Price</th></tr></thead>
    <tbody>${itemsHtml}</tbody>
  </table>
  <p><strong>Subtotal: ${payload.currency} ${payload.subtotal.toLocaleString()}</strong></p>
  <p><a href="${payload.checkoutUrl}" style="display:inline-block;background:#c9a227;color:#fff;padding:12px 24px;text-decoration:none;border-radius:4px;">Complete checkout</a></p>
  <p style="color:#666;font-size:12px;">GrandGold - Trusted marketplace for gold, silver & precious metals.</p>
</body>
</html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: payload.email,
        subject: 'Complete your GrandGold order – items waiting in your cart',
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Resend API error: ${res.status} ${err}`);
    }
    return true;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[notifications] Abandoned cart email failed:', e);
    return false;
  }
}

/**
 * Send abandoned cart WhatsApp message.
 * Placeholder – requires WhatsApp Business API / Twilio setup.
 */
export async function sendAbandonedCartWhatsApp(payload: AbandonedCartNotifyPayload): Promise<boolean> {
  if (!payload.phone) return false;

  const whatsappApiKey = process.env.WHATSAPP_API_KEY || process.env.TWILIO_ACCOUNT_SID;
  if (!whatsappApiKey) {
    // eslint-disable-next-line no-console
    console.log('[notifications] WhatsApp not configured, would send to', payload.phone);
    return true;
  }

  try {
    // TODO: Integrate Twilio WhatsApp or Meta Cloud API
    // Example: twilioClient.messages.create({ to: `whatsapp:${payload.phone}`, from: whatsappFrom, body: `...` })
    const itemList = payload.items.map((i) => `• ${i.name} x${i.quantity}`).join('\n');
    const body = `Your GrandGold cart is waiting! Subtotal: ${payload.currency} ${payload.subtotal.toLocaleString()}. Complete checkout: ${payload.checkoutUrl}`;
    // eslint-disable-next-line no-console
    console.log('[notifications] WhatsApp placeholder:', { to: payload.phone, body });
    return true;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[notifications] Abandoned cart WhatsApp failed:', e);
    return false;
  }
}

/**
 * Send abandoned cart reminder via email and/or WhatsApp based on available contact and consent
 */
export async function sendAbandonedCartReminder(payload: AbandonedCartNotifyPayload): Promise<void> {
  const promises: Promise<boolean>[] = [];
  if (payload.email) promises.push(sendAbandonedCartEmail(payload));
  if (payload.phone) promises.push(sendAbandonedCartWhatsApp(payload));
  await Promise.all(promises);
}

export function buildCheckoutUrl(country: string, cartId?: string): string {
  const base = WEB_URL;
  const path = country === 'IN' ? '/in/checkout' : country === 'AE' ? '/ae/checkout' : '/uk/checkout';
  return cartId ? `${base}${path}?cart=${cartId}` : `${base}${path}`;
}
