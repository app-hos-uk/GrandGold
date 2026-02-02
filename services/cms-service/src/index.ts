export default {
  register(/*{ strapi }*/) {},

  async bootstrap({ strapi }: { strapi: any }) {
    const runSeed = process.env.RUN_CMS_SEED === 'true';
    if (!runSeed) return;

    try {
      const existingHomepage = await strapi.entityService.findMany(
        'api::homepage.homepage',
        { limit: 1 }
      );
      const hasContent = Array.isArray(existingHomepage)
        ? existingHomepage.length > 0
        : !!existingHomepage;
      if (hasContent) {
        strapi.log.info('CMS seed skipped: content already exists');
        return;
      }

      strapi.log.info('Seeding CMS with initial content...');

      const now = new Date().toISOString();

      // Homepage
      await strapi.entityService.create('api::homepage.homepage', {
        data: {
          publishedAt: now,
          heroTitle: 'Buy & Sell Gold, Silver & Precious Metals',
          heroSubtitle:
            'Trusted marketplace for certified gold, silver, and platinum. Secure delivery, transparent pricing, multi-country support.',
          heroCTA: {
            text: 'Shop Gold',
            link: '/products?metal=gold',
            variant: 'primary',
            openInNewTab: false,
          },
          trustBadges: [
            { title: 'Certified Purity', description: 'BIS hallmark certified', iconName: 'certificate' },
            { title: 'Secure Delivery', description: 'Insured shipping', iconName: 'shield' },
            { title: 'Best Price', description: 'Live market pricing', iconName: 'trending' },
          ],
          testimonials: [
            { name: 'Rahul S.', role: 'Customer', content: 'Smooth transaction, gold delivered as promised.', rating: 5, country: 'IN' },
            { name: 'Fatima A.', role: 'Customer', content: 'Best platform for buying gold in UAE.', rating: 5, country: 'AE' },
          ],
          seo: {
            metaTitle: 'GrandGold - Buy & Sell Precious Metals',
            metaDescription: 'Trusted marketplace for gold, silver, and platinum. Certified purity, secure delivery, transparent pricing.',
          },
        },
        locale: 'en',
      });

      // FAQs - General
      const faqData = [
        { question: 'How do I create an account?', answer: 'Click Sign Up on the top right. Enter your email, set a password, and verify your email. For higher limits, complete KYC (identity verification).', category: 'general', country: 'all', priority: 10 },
        { question: 'What is KYC and why do I need it?', answer: 'KYC (Know Your Customer) is identity verification required by regulations. Tier 1 (email + phone) allows small transactions. Tier 2 (ID documents) enables higher limits. Tier 3 (enhanced due diligence) is for large transactions.', category: 'kyc', country: 'all', priority: 9 },
        { question: 'How does pricing work?', answer: 'We use live spot prices from trusted sources. Your final price includes a small margin, making charges, and any applicable taxes. You can lock the price for a limited time before checkout.', category: 'pricing', country: 'all', priority: 9 },
        { question: 'What payment methods are accepted?', answer: 'We accept UPI, cards, net banking (India), cards and PayPal (UAE/UK), EMI options, and BNPL where available. Some methods vary by country.', category: 'payments', country: 'all', priority: 8 },
        { question: 'How long does delivery take?', answer: 'Standard delivery: 3–7 business days. Express: 1–2 days where available. International orders may take 5–14 days. You can track your order in real time.', category: 'shipping', country: 'all', priority: 8 },
        { question: 'What is your return policy?', answer: 'Unopened, tamper-evident items can be returned within 7 days. Opened items may be returned for exchange or credit in some cases. See our Refund Policy for details.', category: 'returns', country: 'all', priority: 7 },
        { question: 'Is my gold certified?', answer: 'Yes. Our gold products carry BIS hallmark (India), DMCC certification (UAE), or LBMA-accredited refinery marks (UK). Certificates are provided with purchase.', category: 'general', country: 'all', priority: 8 },
        { question: 'How do I become a seller?', answer: 'Apply via the Seller Onboarding page. Complete business verification, bank details, and agreement. Once approved, you can list products and manage orders.', category: 'seller', country: 'all', priority: 6 },
      ];

      for (const faq of faqData) {
        await strapi.entityService.create('api::faq.faq', {
          data: { ...faq, publishedAt: now },
          locale: 'en',
        });
      }

      // Legal Pages
      const legalData = [
        {
          title: 'Terms of Service',
          slug: 'terms-of-service',
          type: 'terms_of_service',
          content: `# Terms of Service

Welcome to GrandGold. By using our platform, you agree to these terms.

## 1. Eligibility
You must be 18+ and legally able to enter binding contracts in your jurisdiction.

## 2. Account
You are responsible for keeping your credentials secure. Notify us of any unauthorized access.

## 3. Transactions
All transactions are subject to our pricing, KYC, and payment terms. We reserve the right to refuse orders.

## 4. Limitation of Liability
GrandGold is not liable for indirect, incidental, or consequential damages beyond the purchase price.

## 5. Changes
We may update these terms. Continued use constitutes acceptance.

*Last updated: ${new Date().toISOString().split('T')[0]}*`,
          country: 'all',
          effectiveDate: new Date().toISOString().split('T')[0],
          seo: { metaTitle: 'Terms of Service | GrandGold', metaDescription: 'GrandGold marketplace terms of service.' },
        },
        {
          title: 'Privacy Policy',
          slug: 'privacy-policy',
          type: 'privacy_policy',
          content: `# Privacy Policy

GrandGold respects your privacy. This policy explains how we collect, use, and protect your data.

## 1. Data We Collect
- Account info (email, phone, name)
- KYC documents (for verification)
- Order and transaction history
- Device and usage data

## 2. How We Use It
- Process orders and payments
- Verify identity (KYC/AML)
- Improve our services
- Comply with legal obligations

## 3. Sharing
We share data with payment processors, logistics partners, and regulators as required. We do not sell your data.

## 4. Security
We use encryption, access controls, and regular audits to protect your data.

## 5. Your Rights
You may access, correct, or delete your data. Contact us for requests.

*Last updated: ${new Date().toISOString().split('T')[0]}*`,
          country: 'all',
          effectiveDate: new Date().toISOString().split('T')[0],
          seo: { metaTitle: 'Privacy Policy | GrandGold', metaDescription: 'GrandGold privacy policy and data handling.' },
        },
        {
          title: 'Refund Policy',
          slug: 'refund-policy',
          type: 'refund_policy',
          content: `# Refund Policy

## 1. Eligibility
- Unopened, tamper-evident items: Full refund within 7 days
- Defective items: Exchange or refund
- Opened items: Case-by-case; may receive store credit

## 2. Process
1. Initiate return in your account
2. Ship item with return label
3. We inspect and process refund within 5–7 business days

## 3. Payment Method
Refunds go to the original payment method. Bank processing may take additional days.

## 4. Exclusions
Custom or engraved items may not be eligible. See product page for details.

*Last updated: ${new Date().toISOString().split('T')[0]}*`,
          country: 'all',
          effectiveDate: new Date().toISOString().split('T')[0],
          seo: { metaTitle: 'Refund Policy | GrandGold', metaDescription: 'GrandGold refund and return policy.' },
        },
      ];

      for (const legal of legalData) {
        await strapi.entityService.create('api::legal-page.legal-page', {
          data: { ...legal, publishedAt: now },
          locale: 'en',
        });
      }

      // Announcements
      await strapi.entityService.create('api::announcement.announcement', {
        data: {
          message: 'Welcome to GrandGold! Buy and sell certified gold, silver & platinum with transparent pricing.',
          type: 'info',
          placement: 'top_bar',
          country: 'all',
          dismissible: true,
          priority: 5,
          publishedAt: now,
        },
        locale: 'en',
      });

      strapi.log.info('CMS seed completed successfully.');
    } catch (err) {
      strapi.log.error('CMS seed failed:', err);
    }
  },
};
