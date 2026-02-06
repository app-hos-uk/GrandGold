import { NextRequest, NextResponse } from 'next/server';
import {
  MOCK_PRODUCTS,
  searchProducts,
  getFeaturedProducts,
  getBestsellers,
  getNewArrivals,
  getProductsByCategory,
  getProductContextForAI,
  type MockProduct,
} from '@/lib/product-data';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
  country?: string;
  goldRates?: Record<string, number>;
}

/* ------------------------------------------------------------------ */
/*  Structured response types for rich UI rendering                    */
/* ------------------------------------------------------------------ */

interface ProductCard {
  id: string;
  name: string;
  slug: string;
  price: number;
  purity: string;
  metalType: string;
  category: string;
  weight: string;
  inStock: boolean;
}

/** Navigation action the widget can trigger */
interface NavigateAction {
  label: string;
  /** Path relative to /{country}/ */
  path: string;
  type: 'product' | 'category' | 'page';
}

interface ChatResponse {
  reply: string;
  success: boolean;
  /** Structured cards the widget can render inline */
  products?: ProductCard[];
  /** Quick-reply suggestion chips */
  suggestions?: string[];
  /** Response type helps widget render differently */
  type?: 'text' | 'products' | 'gifting' | 'pricing' | 'trend' | 'occasion';
  /** Navigation links the widget renders as action buttons */
  navigateActions?: NavigateAction[];
}

/* ------------------------------------------------------------------ */
/*  Comprehensive knowledge base                                       */
/* ------------------------------------------------------------------ */

const KNOWLEDGE = {
  pricing: `**Transparent Pricing at GrandGold:**
- All prices are based on **live international gold rates**, updated every minute
- Pricing = (Gold weight x Live gold rate) + Making charges + GST
- Making charges vary by design complexity (5-25% of metal value)
- No hidden charges — what you see is what you pay
- Prices may vary slightly between India, UAE, and UK due to local taxes and import duties

💡 **Tip:** Enable Price Alerts to get notified when gold rates dip!`,

  goldRates: `**Current Gold Rates (Indicative):**
| Purity | India (₹/g) | UAE (AED/g) | UK (£/g) |
|--------|-------------|-------------|----------|
| 24K    | ~₹6,250     | ~AED 242    | ~£52     |
| 22K    | ~₹5,730     | ~AED 222    | ~£48     |
| 18K    | ~₹4,690     | ~AED 181    | ~£39     |

📈 Rates update every minute from international spot prices.
Historical trend: Gold has appreciated ~8-12% annually over the past decade.`,

  priceTrend: `**Gold Price Trends & Analysis:**

📊 **Recent Movement:**
- Last 7 days: Gold is up +0.8%, showing steady demand
- Last 30 days: Up +2.3%, driven by global safe-haven buying
- Last 12 months: Up +11.5%, outperforming most asset classes

📈 **Historical Performance (per 10g, 22K India):**
- 2020: ₹42,000 → 2021: ₹46,000 (+9.5%)
- 2021: ₹46,000 → 2022: ₹49,500 (+7.6%)
- 2022: ₹49,500 → 2023: ₹54,000 (+9.1%)
- 2023: ₹54,000 → 2024: ₹58,500 (+8.3%)
- 2024: ₹58,500 → 2025: ₹63,000 (+7.7%)

💡 **Insight:** Gold tends to rise during festival seasons (Diwali, Akshaya Tritiya, Dhanteras) due to increased demand. Consider buying during quieter months for better value.

🔔 Set a **Price Alert** from your account to get notified at your target price!`,

  shipping: `**Shipping & Delivery:**
- 🆓 **Free shipping** on orders above ₹50,000 (India), AED 5,000 (UAE), £500 (UK)
- 📦 **Standard delivery:** 5-7 business days
- ⚡ **Express delivery:** 2-3 days (select cities in India; all of UAE & UK)
- 🔒 All orders ship with **full insurance** and GPS tracking
- 📍 Track your order in real-time from your account dashboard
- 🏪 **Click & Collect** available at select stores`,

  returns: `**Returns & Exchanges:**
- 📅 **15-day easy return** policy for all standard products
- 🔄 **Exchange** for a different size or design within 30 days
- ⚠️ Custom-made and personalized items are non-returnable
- 💰 Full refund processed within 5-7 business days
- 📋 Initiate returns from your Order Details page → "Request Return"
- 📞 Need help? Contact support or chat with us anytime`,

  kyc: `**KYC Verification Tiers:**
- 🥉 **Tier 1** (Email + Phone): Up to ₹50,000 per transaction
- 🥈 **Tier 2** (ID + Address proof): Up to ₹5,00,000 per transaction
- 🥇 **Tier 3** (Full PAN/Aadhaar): Unlimited transactions

Complete your KYC from Account → Settings → Verification.
Takes just 2-5 minutes with instant approval for Tier 1 & 2.`,

  quality: `**Quality Assurance:**
- ✅ Every piece is **BIS Hallmarked** (India) or Assay certified (UK)
- 📜 Certificate of Authenticity included with every purchase
- 🔬 Diamond products come with **GIA/IGI certification**
- 🏆 Purity options: 24K (99.9%), 22K (91.6%), 18K (75%)
- 🔍 Use our AR Try-On to inspect pieces virtually before buying`,

  payment: `**Payment Options:**
- 💳 **Cards:** Visa, Mastercard, American Express, RuPay
- 📱 **UPI:** GPay, PhonePe, Paytm, BHIM (India)
- 🏦 **Net Banking:** All major banks supported
- 📊 **EMI:** 3, 6, 9, 12 months (0% EMI on select products)
- 💰 **Cash on Delivery** available for orders under ₹1,00,000
- 🌐 **International:** Stripe for UAE & UK customers`,

  customization: `**Custom Jewelry Design:**
1. 📝 Share your design idea, sketch, or reference image
2. 🎨 Our designers create a 3D model for your approval
3. ✅ Approve design, select metal type and stones
4. ⏰ Delivery in 2-4 weeks
5. 💎 Every custom piece comes with a certificate

Starting price: ₹25,000 for simple designs. Contact us or visit the Custom Orders page!`,

  arTryon: `**AR Virtual Try-On:**
1. Visit any product page and tap **"Try On"**
2. Allow camera access
3. See how the jewelry looks on you in real-time!

Works with: Necklaces, Earrings, Rings
Best in: Good lighting, front-facing camera
Available on: Chrome, Safari, Firefox (desktop & mobile)

✨ Try it now: Browse Collections → Select a piece → Click "Try On"`,

  careGuide: `**Jewelry Care Tips:**
- 🧹 Clean gold jewelry with mild soap and warm water
- 💎 Store diamond pieces in soft cloth pouches, separately
- 🚿 Remove jewelry before swimming or using chemicals
- 💍 Get rings professionally cleaned every 6 months
- 📦 Keep in the original GrandGold box for safe storage
- ⚠️ Avoid wearing jewelry during heavy exercise`,
};

/* ------------------------------------------------------------------ */
/*  Gifting & Occasion Knowledge                                       */
/* ------------------------------------------------------------------ */

interface OccasionSuggestion {
  occasion: string;
  description: string;
  budgetRanges: { label: string; min: number; max: number }[];
  categories: string[];
  tags: string[];
  tips: string[];
}

const OCCASION_MAP: Record<string, OccasionSuggestion> = {
  wedding: {
    occasion: 'Wedding / Bridal',
    description: 'The most important jewelry purchase! Bridal sets, mangalsutra, and statement pieces.',
    budgetRanges: [
      { label: 'Essential', min: 100000, max: 200000 },
      { label: 'Premium', min: 200000, max: 500000 },
      { label: 'Luxury', min: 500000, max: 2000000 },
    ],
    categories: ['Necklaces', 'Earrings', 'Bangles', 'Rings'],
    tags: ['bridal', 'wedding', 'kundan', 'temple', 'traditional', 'choker'],
    tips: [
      'Start shopping 2-3 months before the wedding for custom pieces',
      'Consider a mix of traditional and contemporary designs',
      'Bridal sets offer the best value compared to buying pieces separately',
      'Ask about our bridal consultation service for personalized guidance',
    ],
  },
  engagement: {
    occasion: 'Engagement / Proposal',
    description: 'Find the perfect ring to mark your forever moment.',
    budgetRanges: [
      { label: 'Classic', min: 50000, max: 150000 },
      { label: 'Premium', min: 150000, max: 300000 },
      { label: 'Luxury', min: 300000, max: 1000000 },
    ],
    categories: ['Rings'],
    tags: ['solitaire', 'engagement', 'diamond', 'ring', 'proposal'],
    tips: [
      "Know your partner's ring size — borrow one of their existing rings",
      'Solitaire diamonds offer the most brilliance per carat',
      '18K white gold and platinum are the most popular settings',
      'Consider our buyback policy — upgrade your ring on your anniversary!',
    ],
  },
  anniversary: {
    occasion: 'Anniversary',
    description: 'Celebrate your love milestone with a meaningful gift.',
    budgetRanges: [
      { label: 'Thoughtful', min: 20000, max: 75000 },
      { label: 'Special', min: 75000, max: 200000 },
      { label: 'Grand', min: 200000, max: 500000 },
    ],
    categories: ['Rings', 'Pendants', 'Earrings', 'Bracelets'],
    tags: ['anniversary', 'eternity', 'band', 'diamond', 'heart', 'pendant'],
    tips: [
      'Eternity bands are a classic anniversary choice',
      'Engrave a special date or message for a personal touch',
      'Match metals with their existing jewelry collection',
      'Consider upgrading their engagement ring as a surprise!',
    ],
  },
  birthday: {
    occasion: 'Birthday',
    description: 'A birthday gift that sparkles and lasts a lifetime.',
    budgetRanges: [
      { label: 'Sweet', min: 10000, max: 40000 },
      { label: 'Delightful', min: 40000, max: 100000 },
      { label: 'Lavish', min: 100000, max: 300000 },
    ],
    categories: ['Pendants', 'Earrings', 'Bracelets', 'Rings'],
    tags: ['gift', 'pendant', 'charm', 'birthstone', 'heart', 'rose gold'],
    tips: [
      'Birthstone jewelry adds a personal and meaningful touch',
      'Rose gold is trending for younger recipients',
      'Charm bracelets are perfect — add a charm each birthday!',
      'Include a personalized gift message with your order',
    ],
  },
  festival: {
    occasion: 'Festival / Diwali / Akshaya Tritiya',
    description: 'Celebrate auspicious occasions with gold — tradition meets investment.',
    budgetRanges: [
      { label: 'Token', min: 5000, max: 30000 },
      { label: 'Festive', min: 30000, max: 100000 },
      { label: 'Grand', min: 100000, max: 500000 },
    ],
    categories: ['Bangles', 'Necklaces', 'Earrings', 'Pendants'],
    tags: ['traditional', 'bangles', 'filigree', 'temple', 'festive'],
    tips: [
      'Buying gold on Akshaya Tritiya and Dhanteras is considered very auspicious',
      'Gold coins and bars are popular gifts for Diwali',
      'Traditional bangles make perfect festive gifts',
      'Watch for our festival season special offers and discounts!',
    ],
  },
  valentines: {
    occasion: "Valentine's Day / Romance",
    description: "Express your love with jewelry that says 'forever'.",
    budgetRanges: [
      { label: 'Sweet', min: 15000, max: 50000 },
      { label: 'Romantic', min: 50000, max: 150000 },
      { label: 'Grand Gesture', min: 150000, max: 500000 },
    ],
    categories: ['Pendants', 'Rings', 'Bracelets', 'Earrings'],
    tags: ['heart', 'rose gold', 'diamond', 'pendant', 'love', 'couple'],
    tips: [
      'Heart-shaped pendants and rose gold are Valentine favorites',
      'Couple rings make a beautiful matching statement',
      "Surprise with breakfast in bed + a GrandGold jewelry box",
      'Add our premium gift wrapping for the perfect presentation',
    ],
  },
  corporate: {
    occasion: 'Corporate Gift / Achievement',
    description: 'Premium gifts for employees, clients, or business milestones.',
    budgetRanges: [
      { label: 'Token', min: 5000, max: 25000 },
      { label: 'Premium', min: 25000, max: 75000 },
      { label: 'Executive', min: 75000, max: 200000 },
    ],
    categories: ['Pendants', 'Bracelets', 'Rings'],
    tags: ['gift', 'charm', 'elegant', 'office wear', 'pearl'],
    tips: [
      'Gold coins are the most universally appreciated corporate gift',
      'Subtle, elegant pieces work best for professional settings',
      'We offer bulk corporate gifting with custom packaging',
      'Contact us for corporate accounts and special pricing',
    ],
  },
  mothersday: {
    occasion: "Mother's Day / Parents",
    description: 'Show your gratitude with a timeless piece for the most important person.',
    budgetRanges: [
      { label: 'Heartfelt', min: 15000, max: 50000 },
      { label: 'Special', min: 50000, max: 150000 },
      { label: 'Extraordinary', min: 150000, max: 400000 },
    ],
    categories: ['Bangles', 'Pendants', 'Earrings', 'Necklaces'],
    tags: ['traditional', 'bangles', 'pearl', 'elegant', 'pendant'],
    tips: [
      'Traditional gold bangles are a timeless choice for mothers',
      'Pearl jewelry exudes elegance and sophistication',
      'Engrave a message like "Best Mom" on the inside of a bangle',
      "Consider her existing jewelry to pick complementary pieces",
    ],
  },
  graduation: {
    occasion: 'Graduation / Achievement',
    description: 'Mark this milestone with a gift that appreciates over time.',
    budgetRanges: [
      { label: 'Meaningful', min: 10000, max: 30000 },
      { label: 'Celebratory', min: 30000, max: 80000 },
    ],
    categories: ['Pendants', 'Bracelets', 'Rings'],
    tags: ['charm', 'pendant', 'elegant', 'gift'],
    tips: [
      'A pendant with their initial is a popular graduation gift',
      'Charm bracelets let them add memories over the years',
      'Gold coins are a great investment gift for young graduates',
    ],
  },
  selfpurchase: {
    occasion: 'Self-Purchase / Treat Yourself',
    description: "Because you deserve something beautiful. Here are picks you'll love.",
    budgetRanges: [
      { label: 'Everyday', min: 10000, max: 50000 },
      { label: 'Splurge', min: 50000, max: 200000 },
    ],
    categories: ['Earrings', 'Rings', 'Bracelets', 'Pendants'],
    tags: ['office wear', 'elegant', 'daily wear', 'rose gold', 'charm'],
    tips: [
      'Stackable rings and layered necklaces are trending',
      'Pearl earrings are versatile for both work and evenings',
      'Gold is an investment — treat yourself AND your portfolio!',
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  Intent detection                                                    */
/* ------------------------------------------------------------------ */

function detectIntent(message: string): string[] {
  const intents: string[] = [];
  const lower = message.toLowerCase();

  // Occasion / Gifting intents
  if (lower.match(/wedding|bridal|bride|shadi|vivah|nikah|dulhan/)) intents.push('occasion:wedding');
  if (lower.match(/engag|propos|will you marry|say yes/)) intents.push('occasion:engagement');
  if (lower.match(/annivers|milestone|years together/)) intents.push('occasion:anniversary');
  if (lower.match(/birthday|bday|b-day|born|turning \d/)) intents.push('occasion:birthday');
  if (lower.match(/diwali|dhanteras|akshaya|pongal|onam|eid|christmas|navratri|festival|festive/)) intents.push('occasion:festival');
  if (lower.match(/valentine|love|romantic|romance|girlfriend|boyfriend|partner|spouse|wife|husband/)) intents.push('occasion:valentines');
  if (lower.match(/corporate|employee|client gift|business|office gift|achievement|reward/)) intents.push('occasion:corporate');
  if (lower.match(/mother|mom|mum|parent|father|dad|papa/)) intents.push('occasion:mothersday');
  if (lower.match(/graduat|convocation|degree|passing out/)) intents.push('occasion:graduation');
  if (lower.match(/myself|self|treat|i want|for me|i deserve|my collection/)) intents.push('occasion:selfpurchase');
  if (lower.match(/gift|present|surprise|occasion|suggestion|recommend|what should|what can|ideas/)) intents.push('gifting');

  // Budget intents
  if (lower.match(/budget|under \d|below \d|afford|cheap|expensive|cost|within \d|range/)) intents.push('budget');

  // Product intents
  if (lower.match(/necklace|choker|chain|mangalsutra|haar/)) intents.push('product:necklaces');
  if (lower.match(/earring|jhumk|stud|drop|tops|bali/)) intents.push('product:earrings');
  if (lower.match(/ring|band|solitaire/)) intents.push('product:rings');
  if (lower.match(/bangle|kada|bracelet|charm/)) intents.push('product:bangles');
  if (lower.match(/pendant|locket|chain/)) intents.push('product:pendants');

  // Knowledge intents
  if (lower.match(/price|pricing|cost|how much|expensive|afford/)) intents.push('pricing');
  if (lower.match(/trend|historical|appreciate|invest|roi|performance|going up|going down|forecast|predict/)) intents.push('priceTrend');
  if (lower.match(/gold rate|today.*rate|current.*rate|live.*rate|rate today/)) intents.push('goldRates');
  if (lower.match(/ship|deliver|shipping|delivery|courier|track/)) intents.push('shipping');
  if (lower.match(/return|refund|exchange|cancel|money back/)) intents.push('returns');
  if (lower.match(/kyc|verify|verification|identity|document|pan|aadhaar/)) intents.push('kyc');
  if (lower.match(/quality|hallmark|certif|pure|purity|genuine|real|fake|24k|22k|18k|bis/)) intents.push('quality');
  if (lower.match(/pay|payment|card|upi|emi|loan|credit|debit|cod|cash/)) intents.push('payment');
  if (lower.match(/custom|design|personali|engrav|made to order|bespoke/)) intents.push('customization');
  if (lower.match(/try on|ar|augmented|virtual|camera|see how/)) intents.push('arTryon');
  if (lower.match(/care|clean|maintain|store|polish|tarnish/)) intents.push('careGuide');
  if (lower.match(/recommend|suggest|best|popular|trending|featured|bestseller|top|must have/)) intents.push('recommendation');
  if (lower.match(/product|jewelry|jewellery|collection|catalogue|catalog|browse|show me/)) intents.push('product');
  if (lower.match(/compar|vs|versus|differ|between/)) intents.push('compare');

  // Navigation intents (customer wants to go somewhere)
  if (lower.match(/show me|take me|navigate|go to|open|browse|view|look at|where (?:is|are|can i find)/)) intents.push('navigate');
  if (lower.match(/cart|checkout|my cart/)) intents.push('navigate:cart');
  if (lower.match(/order|my order|track.*order/)) intents.push('navigate:orders');
  if (lower.match(/wishlist|saved|favorites/)) intents.push('navigate:wishlist');
  if (lower.match(/account|profile|my account|settings/)) intents.push('navigate:account');
  if (lower.match(/collection|all jewelry|full catalog|all product/)) intents.push('navigate:collections');
  if (lower.match(/try on|ar|augmented|virtual try/)) intents.push('navigate:artryon');

  // Meta intents
  if (lower.match(/human|agent|person|speak|call|contact|help|support|complaint/)) intents.push('human');
  if (lower.match(/^(hello|hi|hey|namaste|good morning|good evening|good afternoon|howdy|greetings)/)) intents.push('greeting');
  if (lower.match(/thank|thanks|great|awesome|perfect|wonderful|amazing|excellent/)) intents.push('thanks');
  if (lower.match(/what can you|what do you|who are you|capabilities|features|help me/)) intents.push('capabilities');

  return intents;
}

/* ------------------------------------------------------------------ */
/*  Budget extraction                                                   */
/* ------------------------------------------------------------------ */

function extractBudget(message: string): { min: number; max: number } | null {
  const lower = message.toLowerCase().replace(/,/g, '');
  // "under 50000", "below 1 lakh"
  const underMatch = lower.match(/(?:under|below|within|upto|up to|less than|max)\s*(?:rs\.?|₹|inr)?\s*(\d+)\s*(?:k|lakh|lac)?/);
  if (underMatch) {
    let val = parseInt(underMatch[1]);
    if (lower.includes('lakh') || lower.includes('lac')) val *= 100000;
    else if (lower.includes('k') || (val < 1000 && val > 0)) val *= 1000;
    return { min: 0, max: val };
  }
  // "50000 to 100000" or "50k-100k"
  const rangeMatch = lower.match(/(\d+)\s*(?:k|lakh|lac)?\s*(?:to|-)\s*(\d+)\s*(?:k|lakh|lac)?/);
  if (rangeMatch) {
    let min = parseInt(rangeMatch[1]);
    let max = parseInt(rangeMatch[2]);
    if (min < 1000) min *= 1000;
    if (max < 1000) max *= 1000;
    return { min, max };
  }
  // standalone number: "around 50000"
  const numMatch = lower.match(/(?:around|about|roughly|approx)\s*(?:rs\.?|₹|inr)?\s*(\d+)\s*(?:k|lakh)?/);
  if (numMatch) {
    let val = parseInt(numMatch[1]);
    if (lower.includes('lakh') || lower.includes('lac')) val *= 100000;
    else if (val < 1000) val *= 1000;
    return { min: Math.floor(val * 0.7), max: Math.ceil(val * 1.3) };
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Product helpers                                                     */
/* ------------------------------------------------------------------ */

function toProductCard(p: MockProduct): ProductCard {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    purity: p.purity,
    metalType: p.metalType,
    category: p.category,
    weight: p.weight,
    inStock: p.inStock,
  };
}

/** Build navigate actions for a product list */
function buildProductNavActions(products: MockProduct[]): NavigateAction[] {
  const actions: NavigateAction[] = [];
  // Add individual product links for top 2
  products.slice(0, 2).forEach((p) => {
    actions.push({ label: `View ${p.name.length > 25 ? p.name.substring(0, 25) + '...' : p.name}`, path: `/product/${p.id}`, type: 'product' });
  });
  // Add category link if all same category
  const cats = [...new Set(products.map((p) => p.category))];
  if (cats.length === 1) {
    actions.push({ label: `Browse all ${cats[0]}`, path: `/category/${cats[0].toLowerCase()}`, type: 'category' });
  } else if (cats.length <= 3) {
    cats.slice(0, 2).forEach((c) => {
      actions.push({ label: `Browse ${c}`, path: `/category/${c.toLowerCase()}`, type: 'category' });
    });
  }
  return actions;
}

/** Build navigate actions for specific pages */
function pageNavAction(label: string, path: string): NavigateAction {
  return { label, path, type: 'page' };
}

function filterByBudget(products: MockProduct[], budget: { min: number; max: number }): MockProduct[] {
  return products.filter((p) => p.price >= budget.min && p.price <= budget.max && p.inStock);
}

function getProductsForOccasion(occ: OccasionSuggestion, budget?: { min: number; max: number } | null): MockProduct[] {
  let results = MOCK_PRODUCTS.filter(
    (p) =>
      p.inStock &&
      (occ.categories.some((c) => p.category === c) ||
        occ.tags.some((t) => p.tags.includes(t) || p.name.toLowerCase().includes(t) || p.description.toLowerCase().includes(t)))
  );
  if (budget) {
    results = filterByBudget(results, budget);
  }
  // Score by tag match count
  results.sort((a, b) => {
    const scoreA = occ.tags.filter((t) => a.tags.includes(t) || a.name.toLowerCase().includes(t)).length;
    const scoreB = occ.tags.filter((t) => b.tags.includes(t) || b.name.toLowerCase().includes(t)).length;
    return scoreB - scoreA;
  });
  return results.slice(0, 6);
}

/* ------------------------------------------------------------------ */
/*  Response generation                                                 */
/* ------------------------------------------------------------------ */

function generateResponse(message: string, history: ChatMessage[], goldRates?: Record<string, number>): ChatResponse {
  const intents = detectIntent(message);
  const budget = extractBudget(message);

  // ---- Greeting ----
  if (intents.includes('greeting')) {
    return {
      reply: "Hello! Welcome to GrandGold. I'm your personal jewelry advisor. I can help you with:\n\n" +
        "- **Gift suggestions** for any occasion (weddings, birthdays, anniversaries...)\n" +
        "- **Product recommendations** based on your style and budget\n" +
        "- **Live gold rates** and pricing trends\n" +
        "- **Orders, shipping, returns** and more\n\n" +
        "What brings you here today?",
      success: true,
      suggestions: [
        "Gift for a wedding",
        "Show me trending jewelry",
        "What's today's gold rate?",
        "Gold price trends",
        "I need an engagement ring",
        "Help me pick a birthday gift",
      ],
      type: 'text',
    };
  }

  // ---- Capabilities ----
  if (intents.includes('capabilities')) {
    return {
      reply: "I'm GrandGold's AI jewelry advisor! Here's what I can do:\n\n" +
        "🎁 **Gifting Advisor** — Tell me the occasion, recipient, and budget and I'll find the perfect piece\n" +
        "📈 **Pricing Expert** — Live gold rates, historical trends, and investment insights\n" +
        "💎 **Product Guide** — Browse by category, style, or price range\n" +
        "🤵 **Occasion Specialist** — Wedding, engagement, anniversary, festival jewelry\n" +
        "📦 **Order Support** — Shipping, returns, KYC, payment help\n" +
        "✨ **Style Tips** — Jewelry care, pairing advice, and trends\n\n" +
        "Just ask me anything!",
      success: true,
      suggestions: [
        "Suggest a wedding gift",
        "Gold price trends",
        "Show me bestsellers",
        "Engagement ring under 2 lakh",
        "How to care for gold jewelry?",
      ],
      type: 'text',
    };
  }

  // ---- Thanks ----
  if (intents.includes('thanks')) {
    return {
      reply: "You're welcome! It's been a pleasure helping you. If you need anything else — whether it's finding the perfect piece, checking gold rates, or tracking an order — I'm always here.\n\nHappy shopping! ✨",
      success: true,
      suggestions: ["Show me bestsellers", "What's today's gold rate?", "Gift ideas"],
      type: 'text',
    };
  }

  // ---- Human agent ----
  if (intents.includes('human')) {
    return {
      reply: "I'll connect you with our support team right away. Here are your options:\n\n" +
        "📞 **Call:** 1800-123-GOLD (toll-free, 9 AM - 9 PM IST)\n" +
        "📧 **Email:** Info@thegrandgold.com\n" +
        "💬 **Live Chat:** Our agents respond within 15 minutes during business hours\n" +
        "📋 **Contact Page:** Request a callback at your preferred time\n\n" +
        "Is there anything I can help with while you wait?",
      success: true,
      suggestions: ["Track my order", "Return policy", "KYC help"],
      type: 'text',
    };
  }

  // ---- Occasion-based gifting ----
  const occasionIntents = intents.filter((i) => i.startsWith('occasion:'));
  if (occasionIntents.length > 0) {
    const occasionKey = occasionIntents[0].split(':')[1];
    const occ = OCCASION_MAP[occasionKey];
    if (occ) {
      const products = getProductsForOccasion(occ, budget);
      const budgetStr = budget ? ` within your budget of ₹${budget.min.toLocaleString('en-IN')} - ₹${budget.max.toLocaleString('en-IN')}` : '';

      let reply = `## 🎁 ${occ.occasion} Jewelry Guide\n\n`;
      reply += `${occ.description}\n\n`;

      if (!budget) {
        reply += `**Budget Ranges:**\n`;
        occ.budgetRanges.forEach((b) => {
          reply += `- ${b.label}: ₹${b.min.toLocaleString('en-IN')} - ₹${b.max.toLocaleString('en-IN')}\n`;
        });
        reply += '\n';
      }

      if (products.length > 0) {
        reply += `**My Top Picks${budgetStr}:**\n\n`;
        products.forEach((p) => {
          reply += `• **${p.name}** — ₹${p.price.toLocaleString('en-IN')} (${p.purity} ${p.metalType})\n`;
        });
        reply += '\n';
      } else if (budget) {
        reply += `I don't have exact matches in that budget, but here are some close options:\n\n`;
        const fallback = getProductsForOccasion(occ);
        fallback.slice(0, 3).forEach((p) => {
          reply += `• **${p.name}** — ₹${p.price.toLocaleString('en-IN')} (${p.purity} ${p.metalType})\n`;
        });
        reply += '\n';
      }

      reply += `**💡 Expert Tips:**\n`;
      occ.tips.forEach((tip) => {
        reply += `- ${tip}\n`;
      });

      const suggestionChips: string[] = [];
      if (!budget) suggestionChips.push(`${occ.occasion} under 1 lakh`);
      suggestionChips.push(`Show me ${occ.categories[0]?.toLowerCase() || 'jewelry'}`);
      if (occ.categories.length > 1) suggestionChips.push(`Browse ${occ.categories[1]?.toLowerCase()}`);
      suggestionChips.push("Compare with other options");
      suggestionChips.push("Gold price trends");

      return {
        reply,
        success: true,
        products: products.map(toProductCard),
        suggestions: suggestionChips,
        type: 'occasion',
        navigateActions: [
          ...buildProductNavActions(products),
          pageNavAction('Browse Collections', '/collections'),
        ],
      };
    }
  }

  // ---- General gifting intent ----
  if (intents.includes('gifting') && occasionIntents.length === 0) {
    let reply = "## 🎁 Jewelry Gifting Guide\n\nI'd love to help you find the perfect gift! What's the occasion?\n\n";
    reply += "🎊 **Wedding / Bridal** — Necklace sets, bangles, bridal jewelry\n";
    reply += "💍 **Engagement** — Solitaire rings, diamond bands\n";
    reply += "❤️ **Anniversary** — Eternity bands, diamond pendants\n";
    reply += "🎂 **Birthday** — Pendants, charm bracelets, earrings\n";
    reply += "🪔 **Festival / Diwali** — Gold bangles, coins, traditional sets\n";
    reply += "💝 **Valentine's Day** — Heart pendants, rose gold pieces\n";
    reply += "👔 **Corporate Gift** — Gold coins, elegant pendants\n";
    reply += "👩 **Mother's Day** — Pearl earrings, bangles, pendants\n";
    reply += "🎓 **Graduation** — Initial pendants, charm bracelets\n\n";
    reply += "Just tell me the **occasion** and **budget**, and I'll curate the perfect selection!";

    return {
      reply,
      success: true,
      suggestions: [
        "Wedding gift ideas",
        "Birthday gift under 50000",
        "Engagement ring",
        "Anniversary gift for wife",
        "Diwali gold shopping",
        "Valentine's Day gift",
      ],
      type: 'gifting',
      navigateActions: [pageNavAction('Browse Collections', '/collections')],
    };
  }

  // ---- Price trends ----
  if (intents.includes('priceTrend')) {
    return {
      reply: KNOWLEDGE.priceTrend,
      success: true,
      suggestions: ["Today's gold rate", "Best time to buy gold", "Show me gold jewelry", "Investment in gold"],
      type: 'trend',
    };
  }

  // ---- Live gold rates ----
  if (intents.includes('goldRates')) {
    let rateInfo = KNOWLEDGE.goldRates;
    if (goldRates && Object.keys(goldRates).length > 0) {
      rateInfo = "**Today's Live Gold Rates (24K per gram):**\n\n";
      if (goldRates.INR) rateInfo += `🇮🇳 India: **₹${goldRates.INR.toLocaleString('en-IN', { maximumFractionDigits: 0 })}**/gram\n`;
      if (goldRates.AED) rateInfo += `🇦🇪 UAE: **AED ${goldRates.AED.toFixed(2)}**/gram\n`;
      if (goldRates.GBP) rateInfo += `🇬🇧 UK: **£${goldRates.GBP.toFixed(2)}**/gram\n`;
      rateInfo += `\n_Updated just now from live international spot prices._\n`;
      rateInfo += `\n**22K rates** are approximately 91.6% of 24K rates.\n`;
      rateInfo += `**18K rates** are approximately 75% of 24K rates.\n`;
      rateInfo += `\n📈 Gold has appreciated ~8-12% annually over the past decade.`;
    }
    return {
      reply: rateInfo,
      success: true,
      suggestions: ["Gold price trends", "Best time to buy gold", "Show me gold jewelry", "Set a price alert"],
      type: 'pricing',
    };
  }

  // ---- Product category browsing ----
  const productIntents = intents.filter((i) => i.startsWith('product:'));
  if (productIntents.length > 0) {
    const category = productIntents[0].split(':')[1];
    const categoryMap: Record<string, string> = {
      necklaces: 'Necklaces',
      earrings: 'Earrings',
      rings: 'Rings',
      bangles: 'Bangles',
      pendants: 'Pendants',
      bracelets: 'Bracelets',
    };
    const catName = categoryMap[category] || category;
    let products = getProductsByCategory(catName);
    if (budget) {
      products = filterByBudget(products, budget);
    }
    if (products.length === 0) {
      // Try related categories
      products = MOCK_PRODUCTS.filter(
        (p) => p.inStock && (p.category.toLowerCase().includes(category) || p.tags.some((t) => t.includes(category)))
      );
      if (budget) products = filterByBudget(products, budget);
    }

    const budgetStr = budget ? ` within ₹${budget.min.toLocaleString('en-IN')} - ₹${budget.max.toLocaleString('en-IN')}` : '';

    if (products.length > 0) {
      const top = products.slice(0, 5);
      let reply = `## ${catName} Collection${budgetStr}\n\n`;
      reply += `Here are our ${catName.toLowerCase()} that I'd recommend:\n\n`;
      top.forEach((p) => {
        reply += `• **${p.name}** — ₹${p.price.toLocaleString('en-IN')} (${p.purity} ${p.metalType}, ${p.weight})\n  ${p.description.substring(0, 100)}...\n\n`;
      });
      reply += `Would you like more details, or shall I help you try these on virtually with our AR feature?`;

      return {
        reply,
        success: true,
        products: top.map(toProductCard),
        suggestions: [`${catName} under 1 lakh`, "Try AR Try-On", "Compare options", "Gift wrapping available?"],
        type: 'products',
        navigateActions: [
          pageNavAction(`Browse all ${catName}`, `/category/${catName.toLowerCase()}`),
          ...buildProductNavActions(top),
          pageNavAction('AR Try-On', '/ar-tryon'),
        ],
      };
    } else {
      return {
        reply: `I couldn't find ${catName.toLowerCase()}${budgetStr} right now. Let me suggest some alternatives:\n\n` +
          getFeaturedProducts().slice(0, 3).map((p) => `• **${p.name}** — ₹${p.price.toLocaleString('en-IN')}`).join('\n') +
          `\n\nWould you like to explore a different category or adjust your budget?`,
        success: true,
        products: getFeaturedProducts().slice(0, 3).map(toProductCard),
        suggestions: ["Show all categories", "Bestsellers", "New arrivals", "Adjust budget"],
        type: 'products',
        navigateActions: [pageNavAction('Browse Collections', '/collections')],
      };
    }
  }

  // ---- Recommendation / trending ----
  if (intents.includes('recommendation') || intents.includes('product')) {
    const bestsellers = getBestsellers();
    const newArrivals = getNewArrivals();
    let results = budget ? filterByBudget([...bestsellers, ...newArrivals], budget) : [...bestsellers, ...newArrivals];
    // dedupe
    const seen = new Set<string>();
    results = results.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    const productReco = searchProducts(message);
    if (productReco.length > 0) {
      results = [...productReco.slice(0, 3), ...results.filter((r) => !productReco.find((p) => p.id === r.id))];
    }

    results = results.slice(0, 6);
    const budgetStr = budget ? ` within your budget` : '';

    let reply = `## ✨ Recommended for You${budgetStr}\n\n`;

    const bsInResults = results.filter((r) => r.bestseller);
    if (bsInResults.length > 0) {
      reply += `**🏆 Bestsellers:**\n`;
      bsInResults.slice(0, 3).forEach((p) => {
        reply += `• **${p.name}** — ₹${p.price.toLocaleString('en-IN')} (${p.purity} ${p.metalType})\n`;
      });
      reply += '\n';
    }

    const naInResults = results.filter((r) => r.newArrival && !r.bestseller);
    if (naInResults.length > 0) {
      reply += `**🆕 New Arrivals:**\n`;
      naInResults.slice(0, 3).forEach((p) => {
        reply += `• **${p.name}** — ₹${p.price.toLocaleString('en-IN')} (${p.purity} ${p.metalType})\n`;
      });
      reply += '\n';
    }

    reply += 'Would you like details about any of these, or shall I suggest based on a specific occasion?';

    return {
      reply,
      success: true,
      products: results.map(toProductCard),
      suggestions: ["Gift for wedding", "Show me rings", "Gold price trends", "AR Try-On", "Filter by budget"],
      type: 'products',
      navigateActions: [
        pageNavAction('View Collections', '/collections'),
        ...buildProductNavActions(results),
      ],
    };
  }

  // ---- Compare metals ----
  if (intents.includes('compare')) {
    const reply = `## Metal Comparison Guide\n\n` +
      `| Feature | 24K Gold | 22K Gold | 18K Gold | Platinum |\n` +
      `|---------|----------|----------|----------|----------|\n` +
      `| Purity  | 99.9%    | 91.6%    | 75%      | 95%      |\n` +
      `| Color   | Rich yellow | Warm yellow | Subtle yellow | Silver-white |\n` +
      `| Durability | Soft | Good | Very good | Excellent |\n` +
      `| Best for | Investment, coins | Traditional jewelry | Diamond settings | Wedding bands |\n` +
      `| Price (relative) | Highest | High | Medium | High |\n\n` +
      `**💡 Tip:** 22K is the most popular for Indian gold jewelry. 18K is preferred for diamond-studded pieces as it's harder and holds stones better.`;

    return {
      reply,
      success: true,
      suggestions: ["Show me 22K jewelry", "Diamond rings in 18K", "Gold price trends", "Investment gold"],
      type: 'text',
    };
  }

  // ---- Budget query with no occasion ----
  if (intents.includes('budget') && budget) {
    let products = MOCK_PRODUCTS.filter((p) => p.inStock);
    products = filterByBudget(products, budget).slice(0, 6);

    if (products.length > 0) {
      let reply = `## Jewelry in Your Budget (₹${budget.min.toLocaleString('en-IN')} - ₹${budget.max.toLocaleString('en-IN')})\n\n`;
      products.forEach((p) => {
        reply += `• **${p.name}** — ₹${p.price.toLocaleString('en-IN')} (${p.purity} ${p.metalType})\n`;
      });
      reply += `\nWant me to narrow this down by occasion or category?`;

      return {
        reply,
        success: true,
        products: products.map(toProductCard),
        suggestions: ["Filter by occasion", "Show rings only", "Show earrings", "Adjust budget"],
        type: 'products',
        navigateActions: buildProductNavActions(products),
      };
    }
  }

  // ---- Knowledge base queries ----
  const knowledgeIntents = intents.filter((i) => i in KNOWLEDGE);
  if (knowledgeIntents.length > 0) {
    const replies = knowledgeIntents.map((i) => KNOWLEDGE[i as keyof typeof KNOWLEDGE]);
    const suggestionMap: Record<string, string[]> = {
      pricing: ["Today's gold rate", "Price trends", "Show me bestsellers"],
      shipping: ["Track my order", "Click & Collect", "Return policy"],
      returns: ["Start a return", "Exchange policy", "Contact support"],
      kyc: ["Complete my KYC", "Why KYC?", "KYC documents needed"],
      quality: ["Show me 22K jewelry", "Diamond certificates", "BIS hallmark"],
      payment: ["EMI options", "UPI payment", "Saved cards"],
      customization: ["Custom order inquiry", "Design process", "Custom pricing"],
      arTryon: ["Try on necklaces", "Try on rings", "How AR works"],
      careGuide: ["Gold cleaning tips", "Diamond care", "Storage tips"],
    };

    const navMap: Record<string, NavigateAction[]> = {
      kyc: [pageNavAction('Go to KYC Settings', '/account')],
      arTryon: [pageNavAction('Try AR Now', '/ar-tryon')],
      customization: [pageNavAction('Custom Orders', '/collections')],
      shipping: [pageNavAction('Track Orders', '/account')],
      returns: [pageNavAction('My Orders', '/account')],
    };

    return {
      reply: replies.join('\n\n---\n\n'),
      success: true,
      suggestions: suggestionMap[knowledgeIntents[0]] || ["Show me bestsellers", "Gift ideas", "Gold rates"],
      type: 'text',
      navigateActions: navMap[knowledgeIntents[0]],
    };
  }

  // ---- Fallback with context ----
  const context = getProductContextForAI();
  return {
    reply: `I'd love to help! Here's what I can assist with:\n\n` +
      `🎁 **Gift Suggestions** — "Gift for a wedding under 2 lakh"\n` +
      `💎 **Product Search** — "Show me diamond earrings"\n` +
      `📈 **Gold Rates & Trends** — "What's today's gold rate?"\n` +
      `🛒 **Order Help** — "Track my order" or "Return policy"\n` +
      `✨ **Style Advice** — "What suits a birthday gift?"\n\n` +
      `${context}\n\n` +
      `Try asking me something specific, or pick from the suggestions below!`,
    success: true,
    suggestions: [
      "Gift ideas for wedding",
      "Gold price trends",
      "Show me bestsellers",
      "Rings under 1 lakh",
      "How to care for jewelry?",
      "Talk to a human agent",
    ],
    type: 'text',
  };
}

/* ------------------------------------------------------------------ */
/*  API Handler                                                         */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatRequest;
    const { message, history = [], goldRates } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const response = generateResponse(message.trim(), history, goldRates);

    return NextResponse.json(response);
  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process message',
        reply: "I'm sorry, I'm having trouble right now. Please try again or contact our support at Info@thegrandgold.com.",
        success: false,
        suggestions: ["Try again", "Contact support"],
      },
      { status: 500 }
    );
  }
}

/** Health check */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'ai-chat-v2',
    productCount: MOCK_PRODUCTS.length,
    categories: [...new Set(MOCK_PRODUCTS.map((p) => p.category))],
    occasions: Object.keys(OCCASION_MAP),
    capabilities: ['gifting', 'pricing', 'trends', 'products', 'occasions', 'care', 'support'],
  });
}
