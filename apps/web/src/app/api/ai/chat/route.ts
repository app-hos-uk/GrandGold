import { NextRequest, NextResponse } from 'next/server';
import { 
  MOCK_PRODUCTS, 
  searchProducts, 
  getFeaturedProducts, 
  getBestsellers,
  getNewArrivals,
  getProductsByCategory,
  getProductContextForAI,
} from '@/lib/product-data';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
}

/**
 * Knowledge base for common questions
 */
const KNOWLEDGE_BASE = {
  pricing: `Our prices are based on live market rates for gold, silver, and platinum. Each product shows the current price which updates in real-time. We offer transparent pricing with no hidden charges.`,
  
  shipping: `We offer free shipping on orders above ₹50,000. Standard delivery takes 5-7 business days, and express delivery (available in select cities) takes 2-3 days. All orders are shipped with full insurance and GPS tracking.`,
  
  returns: `We have a 15-day easy return policy for all standard products. Custom-made and personalized items are non-returnable. To initiate a return, go to your order details page and click "Request Return".`,
  
  kyc: `KYC (Know Your Customer) verification is required for high-value purchases:
- Tier 1 (Email + Phone): Up to ₹50,000 per transaction
- Tier 2 (ID + Address): Up to ₹5,00,000 per transaction  
- Tier 3 (Full verification): Unlimited transactions
Complete your KYC in the account settings.`,
  
  quality: `All our gold jewelry is BIS hallmarked and certified. We offer:
- 24K (99.9% pure gold) - Investment grade
- 22K (91.6% pure gold) - Traditional jewelry
- 18K (75% pure gold) - Diamond settings
Every piece comes with a certificate of authenticity.`,
  
  payment: `We accept multiple payment methods:
- Credit/Debit cards (Visa, Mastercard, RuPay)
- UPI (GPay, PhonePe, Paytm)
- Net Banking
- EMI options (3, 6, 9, 12 months)
- Gold loan against jewelry`,
  
  customization: `We offer custom jewelry design services:
- Share your design idea or reference image
- Our designers will create a 3D model
- Approve the design and material
- Delivery in 2-4 weeks
Contact us for custom order inquiries.`,
  
  arTryon: `Our AR Try-On feature lets you virtually try jewelry before buying:
1. Go to any product page
2. Click "Try On" button
3. Allow camera access
4. See how the jewelry looks on you!
Works best in good lighting conditions.`,
  
  goldRates: `Today's gold rates (indicative):
- 24K Gold: ₹6,250/gram
- 22K Gold: ₹5,730/gram
- 18K Gold: ₹4,690/gram
Rates update every minute based on international markets.`,
};

/**
 * Intent detection for user messages
 */
function detectIntent(message: string): string[] {
  const intents: string[] = [];
  const lower = message.toLowerCase();
  
  if (lower.match(/price|cost|rate|how much|expensive|cheap|afford/)) intents.push('pricing');
  if (lower.match(/ship|deliver|shipping|delivery|courier|track/)) intents.push('shipping');
  if (lower.match(/return|refund|exchange|cancel|money back/)) intents.push('returns');
  if (lower.match(/kyc|verify|verification|identity|document|pan|aadhaar/)) intents.push('kyc');
  if (lower.match(/quality|hallmark|certif|pure|purity|genuine|real|fake|24k|22k|18k/)) intents.push('quality');
  if (lower.match(/pay|payment|card|upi|emi|loan|credit|debit/)) intents.push('payment');
  if (lower.match(/custom|design|personali|engrav|made to order/)) intents.push('customization');
  if (lower.match(/try on|ar|augmented|virtual|camera|see how/)) intents.push('arTryon');
  if (lower.match(/gold rate|today.*rate|current.*rate|live.*rate/)) intents.push('goldRates');
  if (lower.match(/recommend|suggest|best|popular|trending|featured|bestseller/)) intents.push('recommendation');
  if (lower.match(/product|necklace|earring|ring|bracelet|bangle|pendant|jewelry|jewellery/)) intents.push('product');
  if (lower.match(/human|agent|person|speak|call|contact|help|support/)) intents.push('human');
  if (lower.match(/hello|hi|hey|namaste|good morning|good evening/)) intents.push('greeting');
  if (lower.match(/thank|thanks|great|awesome|perfect/)) intents.push('thanks');
  
  return intents;
}

/**
 * Generate product recommendations
 */
function generateProductRecommendation(query: string): string {
  const lower = query.toLowerCase();
  let products = searchProducts(query);
  
  // If no direct match, try category
  if (products.length === 0) {
    if (lower.includes('necklace') || lower.includes('choker')) {
      products = getProductsByCategory('Necklaces');
    } else if (lower.includes('earring') || lower.includes('jhumka')) {
      products = getProductsByCategory('Earrings');
    } else if (lower.includes('ring') || lower.includes('band')) {
      products = getProductsByCategory('Rings');
    } else if (lower.includes('bangle') || lower.includes('bracelet')) {
      products = getProductsByCategory('Bangles').concat(getProductsByCategory('Bracelets'));
    } else if (lower.includes('pendant')) {
      products = getProductsByCategory('Pendants');
    }
  }
  
  // Still no match? Suggest featured products
  if (products.length === 0) {
    products = getFeaturedProducts().slice(0, 3);
    if (products.length > 0) {
      return `Based on your interest, I recommend checking out our featured collection:\n\n${products.map(p => 
        `• **${p.name}** - ₹${p.price.toLocaleString('en-IN')} (${p.purity} ${p.metalType})`
      ).join('\n')}\n\nWould you like more details about any of these?`;
    }
  }
  
  if (products.length > 0) {
    const top3 = products.slice(0, 3);
    return `Here are some options that might interest you:\n\n${top3.map(p => 
      `• **${p.name}** - ₹${p.price.toLocaleString('en-IN')} (${p.purity} ${p.metalType})\n  ${p.description.substring(0, 80)}...`
    ).join('\n\n')}\n\nWould you like more details about any of these? You can also use our AR Try-On feature to see how they look!`;
  }
  
  return '';
}

/**
 * Generate AI response based on message and context
 */
function generateResponse(message: string, history: ChatMessage[]): string {
  const intents = detectIntent(message);
  const responses: string[] = [];
  
  // Handle greetings
  if (intents.includes('greeting')) {
    const greetings = [
      "Hello! Welcome to GrandGold. I'm here to help you find the perfect jewelry. What are you looking for today?",
      "Namaste! I'm your GrandGold assistant. How can I help you discover beautiful jewelry today?",
      "Hi there! Great to see you at GrandGold. Are you looking for something special?",
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
  
  // Handle thanks
  if (intents.includes('thanks')) {
    return "You're welcome! If you have any more questions about our jewelry or need help with anything else, feel free to ask. Happy shopping! ✨";
  }
  
  // Handle human agent request
  if (intents.includes('human')) {
    return "I'll connect you with a human support agent. Our team typically responds within 2 hours during business hours (9 AM - 9 PM IST). You can also:\n\n• Call us at 1800-123-GOLD (toll-free)\n• Email: support@grandgold.com\n• Request a callback from the Contact page\n\nIs there anything I can help you with while you wait?";
  }
  
  // Handle recommendation requests
  if (intents.includes('recommendation')) {
    const bestsellers = getBestsellers().slice(0, 3);
    const newArrivals = getNewArrivals().slice(0, 2);
    
    let response = "Here are my top recommendations:\n\n**Bestsellers:**\n";
    response += bestsellers.map(p => `• ${p.name} - ₹${p.price.toLocaleString('en-IN')}`).join('\n');
    
    if (newArrivals.length > 0) {
      response += "\n\n**New Arrivals:**\n";
      response += newArrivals.map(p => `• ${p.name} - ₹${p.price.toLocaleString('en-IN')}`).join('\n');
    }
    
    response += "\n\nWould you like to know more about any of these pieces?";
    return response;
  }
  
  // Handle product queries
  if (intents.includes('product')) {
    const recommendation = generateProductRecommendation(message);
    if (recommendation) {
      return recommendation;
    }
  }
  
  // Handle knowledge base queries
  for (const intent of intents) {
    if (intent in KNOWLEDGE_BASE) {
      responses.push(KNOWLEDGE_BASE[intent as keyof typeof KNOWLEDGE_BASE]);
    }
  }
  
  if (responses.length > 0) {
    return responses.join('\n\n');
  }
  
  // Check if asking about specific product
  const productMatch = generateProductRecommendation(message);
  if (productMatch) {
    return productMatch;
  }
  
  // Default response with context
  const context = getProductContextForAI();
  return `Thank you for your message! I can help you with:\n\n• **Product recommendations** - Tell me what you're looking for\n• **Pricing & Gold Rates** - Live market prices\n• **Shipping & Delivery** - Track orders, delivery times\n• **Returns & Refunds** - Our return policy\n• **AR Try-On** - Virtual jewelry experience\n• **KYC & Verification** - Account verification help\n\n${context}\n\nWhat would you like to know more about?`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ChatRequest;
    const { message, history = [] } = body;
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }
    
    // Generate response using our AI logic
    const reply = generateResponse(message.trim(), history);
    
    return NextResponse.json({ 
      reply,
      success: true,
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process message',
        reply: "I'm sorry, I'm having trouble processing your request. Please try again or contact our support team.",
      },
      { status: 500 }
    );
  }
}

/**
 * Health check for the AI chat endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'ai-chat',
    productCount: MOCK_PRODUCTS.length,
    categories: [...new Set(MOCK_PRODUCTS.map(p => p.category))],
  });
}
