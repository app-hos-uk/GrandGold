import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { SkipLink } from '@/components/a11y/skip-link';
import { CartProvider } from '@/contexts/cart-context';
import { WishlistProvider } from '@/contexts/wishlist-context';
import { GoldRateProvider } from '@/contexts/gold-rate-context';

const ChatWidget = dynamic(() => import('@/components/chat/chat-widget').then((m) => ({ default: m.ChatWidget })), {
  ssr: false,
  loading: () => null,
});

const SUPPORTED_COUNTRIES = ['in', 'ae', 'uk'];

export async function generateStaticParams() {
  return SUPPORTED_COUNTRIES.map((country) => ({
    country,
  }));
}

interface CountryLayoutProps {
  children: React.ReactNode;
  params: { country: string };
}

export default function CountryLayout({ children, params }: CountryLayoutProps) {
  // Validate country
  if (!SUPPORTED_COUNTRIES.includes(params.country)) {
    notFound();
  }

  const country = params.country as 'in' | 'ae' | 'uk';

  return (
    <GoldRateProvider country={country}>
      <CartProvider country={country}>
        <WishlistProvider country={country}>
          <SkipLink />
          <Header country={country} />
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
          <Footer country={country} />
          <ChatWidget />
        </WishlistProvider>
      </CartProvider>
    </GoldRateProvider>
  );
}
