# Fix: Next.js Image 400 Bad Request for Shopify CDN

## Problem
`GET /_next/image?url=https://cdn.shopify.com/...` returns **400 Bad Request** because `cdn.shopify.com` is not in the allowed image domains.

## Solution
Add `cdn.shopify.com` to your Next.js config.

### In `next.config.js` (or `next.config.mjs`)

**Option A: Using `domains` (Next.js 12.2 and below)**
```js
module.exports = {
  images: {
    domains: [
      'cdn.shopify.com',
      // ... other domains
    ],
  },
}
```

**Option B: Using `remotePatterns` (Next.js 12.3.0+, recommended)**
```js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        port: '',
        pathname: '/**',
      },
      // Add other patterns if needed
    ],
  },
}
```

### If you already have `images` config
Merge the new entry:

```js
images: {
  remotePatterns: [
    // ... existing patterns
    {
      protocol: 'https',
      hostname: 'cdn.shopify.com',
      port: '',
      pathname: '/**',
    },
  ],
}
```

## After applying
1. Redeploy your app (Railway will pick up the change)
2. Restart the dev server if testing locally

## For your project (hos-marketplaceweb)
The fix has been applied in `apps/web/next.config.js`:
- Added `cdn.shopify.com` to `domains`
- Added `remotePatterns` entry for `cdn.shopify.com`
- Created `SafeImage` component for graceful fallback when optimization fails
- Influencer product grid now uses `SafeImage` for product images
