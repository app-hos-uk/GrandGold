const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  
  // Transpile workspace packages
  transpilePackages: ['@grandgold/types', '@grandgold/utils'],
  
  // Image optimization
  images: {
    domains: [
      'storage.googleapis.com',
      'lh3.googleusercontent.com', // Google avatars
      'platform-lookaside.fbsbx.com', // Facebook avatars
    ],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Redirects for country routing
  async redirects() {
    return [
      // Redirect root to default country based on geolocation (handled in middleware)
      // These are fallback redirects
    ];
  },

  // API proxy to backend services (set in .env.local: AUTH_SERVICE_URL, SELLER_SERVICE_URL, etc.)
  async rewrites() {
    const authUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:4001';
    const sellerUrl = process.env.NEXT_PUBLIC_SELLER_SERVICE_URL || 'http://localhost:4002';
    const fintechUrl = process.env.NEXT_PUBLIC_FINTECH_SERVICE_URL || 'http://localhost:4003';
    const orderUrl = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'http://localhost:4004';
    const paymentUrl = process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL || 'http://localhost:4005';
    const productUrl = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || 'http://localhost:4007';
    const inventoryUrl = process.env.NEXT_PUBLIC_INVENTORY_SERVICE_URL || 'http://localhost:4008';
    const aiUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:4009';
    return [
      { source: '/api/auth/:path*', destination: `${authUrl}/api/auth/:path*` },
      { source: '/api/user/:path*', destination: `${authUrl}/api/user/:path*` },
      { source: '/api/sessions/:path*', destination: `${authUrl}/api/sessions/:path*` },
      { source: '/api/mfa/:path*', destination: `${authUrl}/api/mfa/:path*` },
      { source: '/api/sellers/:path*', destination: `${sellerUrl}/api/sellers/:path*` },
      { source: '/api/orders/:path*', destination: `${orderUrl}/api/orders/:path*` },
      { source: '/api/cart/:path*', destination: `${orderUrl}/api/cart/:path*` },
      { source: '/api/cart', destination: `${orderUrl}/api/cart` },
      { source: '/api/checkout/:path*', destination: `${orderUrl}/api/checkout/:path*` },
      { source: '/api/click-collect/:path*', destination: `${orderUrl}/api/click-collect/:path*` },
      { source: '/api/consultation/:path*', destination: `${orderUrl}/api/consultation/:path*` },
      { source: '/api/notifications/:path*', destination: `${orderUrl}/api/notifications/:path*` },
      { source: '/api/notifications', destination: `${orderUrl}/api/notifications` },
      { source: '/api/push/subscribe', destination: `${orderUrl}/api/notifications/push-subscribe` },
      { source: '/api/inventory/:path*', destination: `${inventoryUrl}/api/inventory/:path*` },
      { source: '/api/products/:path*', destination: `${productUrl}/api/products/:path*` },
      { source: '/api/products', destination: `${productUrl}/api/products` },
      { source: '/api/collections/:path*', destination: `${productUrl}/api/collections/:path*` },
      { source: '/api/search/:path*', destination: `${productUrl}/api/search/:path*` },
      { source: '/api/influencers/:path*', destination: `${productUrl}/api/influencers/:path*` },
      { source: '/api/wishlist/:path*', destination: `${productUrl}/api/wishlist/:path*` },
      { source: '/api/wishlist', destination: `${productUrl}/api/wishlist` },
      { source: '/api/reviews/:path*', destination: `${productUrl}/api/reviews/:path*` },
      { source: '/api/recently-viewed/:path*', destination: `${productUrl}/api/recently-viewed/:path*` },
      { source: '/api/recently-viewed', destination: `${productUrl}/api/recently-viewed` },
      { source: '/api/fintech/:path*', destination: `${fintechUrl}/api/fintech/:path*` },
      { source: '/api/payments/:path*', destination: `${paymentUrl}/api/payments/:path*` },
      { source: '/api/ai/:path*', destination: `${aiUrl}/api/ai/:path*` },
      { source: '/api/ai', destination: `${aiUrl}/api/ai` },
    ];
  },
};

module.exports = withPWA(nextConfig);
