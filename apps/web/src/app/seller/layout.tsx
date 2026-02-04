'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Warehouse,
  Wallet,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  Sparkles,
  Store,
  HelpCircle,
  FileCheck,
} from 'lucide-react';
import { authApi, getStoredToken, ApiError } from '@/lib/api';

const navigation = [
  { name: 'Dashboard', href: '/seller', icon: LayoutDashboard },
  { name: 'Onboarding', href: '/seller/onboarding', icon: FileCheck },
  { name: 'Products', href: '/seller/products', icon: Package },
  { name: 'Orders', href: '/seller/orders', icon: ShoppingCart },
  { name: 'Inventory', href: '/seller/inventory', icon: Warehouse },
  { name: 'Payouts', href: '/seller/payouts', icon: Wallet },
  { name: 'Settings', href: '/seller/settings', icon: Settings },
];

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(pathname === '/seller/login');
  const profileFetchedRef = useRef(false);
  const isRedirectingRef = useRef(false);

  const fetchProfile = useCallback(async () => {
    if (isRedirectingRef.current) return;
    
    const token = getStoredToken();
    if (!token) {
      isRedirectingRef.current = true;
      router.replace('/seller/login');
      return;
    }

    try {
      const user = await authApi.getMe();
      if (user.role !== 'seller') {
        isRedirectingRef.current = true;
        authApi.logout();
        router.replace('/seller/login');
        return;
      }
      setAuthChecked(true);
      profileFetchedRef.current = true;
    } catch (error) {
      // Only redirect on 401 Unauthorized errors
      if (error instanceof ApiError && error.status === 401) {
        isRedirectingRef.current = true;
        authApi.logout();
        router.replace('/seller/login');
      } else {
        console.error('Failed to fetch seller profile:', error);
        if (!profileFetchedRef.current) {
          isRedirectingRef.current = true;
          router.replace('/seller/login');
        }
      }
    }
  }, [router]);

  useEffect(() => {
    if (pathname === '/seller/login') {
      setAuthChecked(true);
      return;
    }
    
    if (!profileFetchedRef.current) {
      fetchProfile();
    }
  }, [pathname, fetchProfile]);

  if (pathname === '/seller/login') {
    return <>{children}</>;
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-gold-500 rounded-xl" />
          <p className="text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <Link href="/seller" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">
              Seller Hub
            </span>
          </Link>
          <button
            className="lg:hidden text-gray-400 hover:text-gray-600"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Store Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3 p-3 bg-gold-50 rounded-xl">
            <div className="w-10 h-10 bg-gold-100 rounded-full flex items-center justify-center">
              <Store className="w-5 h-5 text-gold-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Royal Jewellers</p>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                Verified Seller
              </p>
            </div>
          </div>
        </div>

        <div className="px-3 py-4">
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/seller' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-gold-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <Link
            href="/seller/help"
            className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors mb-2"
          >
            <HelpCircle className="w-5 h-5" />
            <span className="font-medium">Help & Support</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              authApi.logout();
              router.push('/seller/login');
              router.refresh();
            }}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </button>
              
              <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2 w-80">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products, orders..."
                  className="bg-transparent border-none outline-none flex-1 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-500 hover:text-gray-700">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="w-9 h-9 bg-gold-100 rounded-full flex items-center justify-center">
                  <span className="text-gold-600 font-semibold">R</span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">Ravi Kumar</p>
                  <p className="text-xs text-gray-500">Store Owner</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
