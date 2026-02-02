/**
 * Vertex AI (Gemini) service with graceful fallback to mock when GCP is not configured.
 * Set GCP_PROJECT_ID and GOOGLE_APPLICATION_CREDENTIALS for production.
 */

const MOCK_RESPONSES: Record<string, string> = {
  price: "Our prices are based on live market rates for gold, silver, and platinum. You'll see the current price on each product page.",
  order: "You can track your order from your account dashboard. We offer standard (5-7 days) and express (2-3 days) delivery.",
  return: "We have a 15-day easy return policy. Custom-made items are non-returnable. Initiate a return from your order details page.",
  kyc: "KYC (identity verification) is required for higher transaction limits. Tier 1 (email + phone) allows smaller purchases.",
  gold: "All our gold is BIS hallmarked and certified. We offer 22K, 18K, and 24K purity.",
  help: "For immediate help, visit our FAQ or contact support. We typically respond within 2 hours during business hours.",
  hello: "Hello! I'm GrandGold's assistant. I can help with product info, pricing, orders, returns, and more.",
  human: "I'll connect you with a support agent. Our team typically responds within 2 hours. You can also call us or request a callback from the contact page.",
  default: "Thanks for your message. For detailed assistance, please check our FAQ or contact support.",
};

function getMockChatResponse(query: string): string {
  const q = query.toLowerCase();
  if (q.includes('price') || q.includes('pricing') || q.includes('cost')) return MOCK_RESPONSES.price;
  if (q.includes('order') || q.includes('tracking') || q.includes('delivery') || q.includes('shipping')) return MOCK_RESPONSES.order;
  if (q.includes('return') || q.includes('refund') || q.includes('exchange')) return MOCK_RESPONSES.return;
  if (q.includes('kyc') || q.includes('verify') || q.includes('identity')) return MOCK_RESPONSES.kyc;
  if (q.includes('gold') || q.includes('purity') || q.includes('hallmark') || q.includes('22k') || q.includes('24k')) return MOCK_RESPONSES.gold;
  if (q.includes('human') || q.includes('agent') || q.includes('person')) return MOCK_RESPONSES.human;
  if (q.includes('help') || q.includes('support') || q.includes('contact')) return MOCK_RESPONSES.help;
  if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('namaste')) return MOCK_RESPONSES.hello;
  return MOCK_RESPONSES.default;
}

export interface VertexConfig {
  projectId: string;
  location: string;
}

export function isVertexConfigured(): boolean {
  return !!(process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT);
}

export async function generateChatResponse(
  messages: { role: 'user' | 'assistant'; content: string }[],
  userMessage: string
): Promise<string> {
  const projectId = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.VERTEX_AI_LOCATION || 'us-central1';

  if (!projectId) {
    return getMockChatResponse(userMessage);
  }

  try {
    const { VertexAI } = await import('@google-cloud/vertexai');
    const vertex = new VertexAI({ project: projectId, location });
    const model = vertex.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemPrompt = `You are GrandGold's customer support assistant for a premium jewelry marketplace. 
Answer concisely in English about: products, pricing (live gold/silver/platinum rates), orders, shipping, returns, KYC, 
BIS hallmarking, and general jewelry questions. Be helpful and professional.`;

    const historyText = messages
      .slice(-6)
      .map((m) => `${m.role === 'user' ? 'Customer' : 'Assistant'}: ${m.content}`)
      .join('\n');
    const prompt = `${systemPrompt}\n\n${historyText ? `Previous conversation:\n${historyText}\n\n` : ''}Customer: ${userMessage}\n\nAssistant:`;

    const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }] });

    const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
    return text?.trim() || getMockChatResponse(userMessage);
  } catch (err) {
    console.error('Vertex AI chat error:', err);
    return getMockChatResponse(userMessage);
  }
}

/** Describe jewelry in image for visual search - returns search query string */
export async function describeImageForSearch(imageBase64: string, mimeType: string): Promise<string> {
  const projectId = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.VERTEX_AI_LOCATION || 'us-central1';

  if (!projectId) {
    return 'gold necklace earrings traditional';
  }

  try {
    const { VertexAI } = await import('@google-cloud/vertexai');
    const vertex = new VertexAI({ project: projectId, location });
    const model = vertex.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `This image shows jewelry. In one short line, describe the jewelry type, style, and key features for a product search (e.g. "gold necklace kundan traditional" or "diamond earrings jhumka"). 
Output ONLY the search keywords, nothing else.`;

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
              },
            },
            { text: prompt },
          ],
        },
      ],
    });

    const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
    return text?.trim() || 'gold necklace earrings';
  } catch (err) {
    console.error('Vertex AI vision error:', err);
    return 'gold necklace earrings traditional';
  }
}
