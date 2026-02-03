import Link from 'next/link';
import { Sparkles, Facebook, Instagram, Youtube, Twitter } from 'lucide-react';

interface FooterProps {
  country: 'in' | 'ae' | 'uk';
}

const BRAND_TAGLINE = 'Timeless Beauty. Inspired Craftsmanship. Perpetual Value.';

const countryInfo = {
  in: {
    company: 'The Grand Gold and Diamonds LLP',
    address: '1st Floor, Dale Nest Building, Mini Bypass Road, Arayidathupalam, Kozhikode, Kerala - 673004',
    phone: '+91 9567455916',
    email: 'Info@thegrandgold.com',
  },
  ae: {
    company: 'GrandGold DMCC',
    address: 'Dubai Gold Souk, Dubai, UAE',
    phone: '+971 4 123 4567',
    email: 'uae@thegrandgold.com',
  },
  uk: {
    company: 'GrandGold UK Ltd.',
    address: 'London, United Kingdom',
    phone: '+44 20 1234 5678',
    email: 'uk@thegrandgold.com',
  },
};

export function Footer({ country }: FooterProps) {
  const info = countryInfo[country];
  
  const footerLinks = [
    {
      title: 'Shop',
      links: [
        { name: 'All Jewellery', href: `/${country}/collections` },
        { name: 'Cart', href: `/${country}/cart` },
        { name: 'Necklaces', href: `/${country}/category/necklaces` },
        { name: 'Earrings', href: `/${country}/category/earrings` },
        { name: 'Rings', href: `/${country}/category/rings` },
        { name: 'Bracelets', href: `/${country}/category/bracelets` },
        { name: 'Gold Bars', href: `/${country}/category/gold-bars` },
      ],
    },
    {
      title: 'Services',
      links: [
        { name: 'AR Try-On', href: `/${country}/ar-tryon` },
        { name: 'Video Consultation', href: `/${country}/consultation` },
        { name: 'Click & Collect', href: `/${country}/click-collect` },
        { name: 'Custom Orders', href: `/${country}/custom` },
        { name: 'Gold Price Alerts', href: `/${country}/price-alerts` },
      ],
    },
    {
      title: 'Account',
      links: [
        { name: 'My Account', href: `/${country}/account` },
        { name: 'Orders', href: `/${country}/account/orders` },
        { name: 'Wishlist', href: `/${country}/wishlist` },
        { name: 'Address Book', href: `/${country}/account/addresses` },
        { name: 'Settings', href: `/${country}/account/settings` },
      ],
    },
    {
      title: 'Support',
      links: [
        { name: 'Help Center', href: `/${country}/help` },
        { name: 'Shipping Info', href: `/${country}/shipping` },
        { name: 'Returns', href: `/${country}/returns` },
        { name: 'Contact Us', href: `/${country}/contact` },
        { name: 'FAQ', href: `/${country}/faq` },
      ],
    },
  ];

  return (
    <footer className="bg-[#0F0F0F] text-white">
      {/* Burgundy accent bar */}
      <div className="h-1 bg-gradient-to-r from-burgundy-900 via-burgundy-500 to-burgundy-900" />
      {/* Brand tagline */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center font-display text-lg text-gold-400/90 tracking-wide">
            {BRAND_TAGLINE}
          </p>
          <p className="text-center text-burgundy-300/80 text-sm mt-1 tracking-wide">Luxury &amp; Trust</p>
        </div>
      </div>
      {/* Newsletter */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-xl mx-auto text-center">
            <h3 className="text-2xl font-display font-semibold mb-2 text-burgundy-200">Stay Updated</h3>
            <p className="text-gray-400 mb-6">
              Subscribe for exclusive offers, new arrivals, and gold price alerts.
            </p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-gold-500 hover:bg-gold-600 rounded-lg font-medium transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href={`/${country}`} className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-gold rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-xl font-semibold">
                Grand<span className="text-gold-400">Gold</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm mb-4">
              {info.company}
            </p>
            <p className="text-gray-400 text-sm mb-4">
              {info.address}
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-burgundy-300 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-burgundy-300 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-burgundy-300 transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-burgundy-300 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="font-medium mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-burgundy-300 text-sm transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} The Grand Gold. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link
                href={`/${country}/privacy`}
                className="text-gray-400 hover:text-burgundy-300 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href={`/${country}/terms`}
                className="text-gray-400 hover:text-burgundy-300 transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href={`/${country}/cookies`}
                className="text-gray-400 hover:text-burgundy-300 transition-colors"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
