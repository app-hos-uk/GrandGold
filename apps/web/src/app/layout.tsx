import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display, Cormorant_Garamond } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'GrandGold - Luxury Gold & Diamond Jewelry',
    template: '%s | GrandGold',
  },
  description: 'Discover exquisite gold and diamond jewelry from certified sellers across India, UAE, and UK. Experience luxury shopping with AR try-on and live gold pricing.',
  keywords: ['gold jewelry', 'diamond jewelry', 'luxury jewelry', 'online jewelry store', 'gold prices', 'AR try-on'],
  authors: [{ name: 'GrandGold' }],
  creator: 'GrandGold',
  publisher: 'GrandGold',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://thegrandgold.com'),
  alternates: {
    canonical: '/',
    languages: {
      'en-IN': '/in',
      'en-AE': '/ae',
      'en-GB': '/uk',
    },
  },
  openGraph: {
    title: 'GrandGold - Luxury Gold & Diamond Jewelry',
    description: 'Discover exquisite gold and diamond jewelry from certified sellers.',
    url: 'https://thegrandgold.com',
    siteName: 'GrandGold',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'GrandGold Luxury Jewelry',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GrandGold - Luxury Gold & Diamond Jewelry',
    description: 'Discover exquisite gold and diamond jewelry from certified sellers.',
    images: ['/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#C9A227' },
    { media: '(prefers-color-scheme: dark)', color: '#0F0F0F' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      className={`${inter.variable} ${playfair.variable} ${cormorant.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased bg-cream-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
