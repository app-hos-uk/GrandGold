'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ToastProvider } from '@/components/admin/toast';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Store,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  ShieldCheck,
  Receipt,
  UserPlus,
  Shield,
  Boxes,
  FolderTree,
  FileText,
  Wallet,
  Headphones,
  Tag,
  Mail,
  Truck,
  Sparkles,
} from 'lucide-react';
import { adminApi, authApi, ApiError, type CurrentUserProfile } from '@/lib/api';
import { Logo } from '@/components/brand/logo';

const ALL_NAV = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, roles: ['super_admin', 'country_admin'] },
  { name: 'Users', href: '/admin/users', icon: Users, roles: ['super_admin', 'country_admin'] },
  { name: 'Roles', href: '/admin/roles', icon: Shield, roles: ['super_admin', 'country_admin'] },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart, roles: ['super_admin', 'country_admin'] },
  { name: 'Products', href: '/admin/products', icon: Package, roles: ['super_admin', 'country_admin'] },
  { name: 'Categories', href: '/admin/categories', icon: FolderTree, roles: ['super_admin', 'country_admin'] },
  { name: 'Inventory', href: '/admin/inventory', icon: Boxes, roles: ['super_admin', 'country_admin'] },
  { name: 'Sellers', href: '/admin/sellers', icon: Store, roles: ['super_admin', 'country_admin'] },
  { name: 'Finance', href: '/admin/finance', icon: Wallet, roles: ['super_admin', 'country_admin'] },
  { name: 'Promotions', href: '/admin/promotions', icon: Tag, roles: ['super_admin', 'country_admin'] },
  { name: 'Marketing', href: '/admin/marketing', icon: Mail, roles: ['super_admin', 'country_admin'] },
  { name: 'Influencer Marketing', href: '/admin/influencers', icon: Sparkles, roles: ['super_admin', 'country_admin'] },
  { name: 'Support', href: '/admin/support', icon: Headphones, roles: ['super_admin', 'country_admin'] },
  { name: 'KYC', href: '/admin/kyc', icon: ShieldCheck, roles: ['super_admin', 'country_admin'] },
  { name: 'Refunds', href: '/admin/refunds', icon: Receipt, roles: ['super_admin', 'country_admin'] },
  { name: 'Onboarding', href: '/admin/onboarding', icon: UserPlus, roles: ['super_admin', 'country_admin'] },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3, roles: ['super_admin', 'country_admin'] },
  { name: 'Shipping', href: '/admin/shipping', icon: Truck, roles: ['super_admin', 'country_admin'] },
  { name: 'Audit Logs', href: '/admin/audit-logs', icon: FileText, roles: ['super_admin'] },
  { name: 'Settings', href: '/admin/settings', icon: Settings, roles: ['super_admin'] },
];

function getNavigation(role: string) {
  return ALL_NAV.filter((item) => item.roles.includes(role));
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<CurrentUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileFetchedRef = useRef(false);
  const isRedirectingRef = useRef(false);

  // Fetch profile only once on mount, not on every path change
  const fetchProfile = useCallback(async () => {
    if (isRedirectingRef.current) return;
    
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('grandgold_token') || localStorage.getItem('accessToken')
        : null;
    
    if (!token) {
      isRedirectingRef.current = true;
      router.replace('/admin/login');
      return;
    }

    try {
      const user = await adminApi.getMe();
      const role = user?.role;
      if (role !== 'super_admin' && role !== 'country_admin') {
        isRedirectingRef.current = true;
        authApi.logout();
        router.replace('/admin/login');
        return;
      }
      setProfile(user);
      profileFetchedRef.current = true;
    } catch (error) {
      // Only redirect on 401 Unauthorized errors
      if (error instanceof ApiError && error.status === 401) {
        isRedirectingRef.current = true;
        authApi.logout();
        router.replace('/admin/login');
      } else {
        // For other errors (network, 500, etc.), don't redirect if we already have a profile
        console.error('Failed to fetch admin profile:', error);
        if (!profileFetchedRef.current) {
          // First load failed with non-auth error - still redirect
          isRedirectingRef.current = true;
          router.replace('/admin/login');
        }
        // Otherwise keep the existing profile and don't disrupt the session
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (pathname === '/admin/login') {
      setLoading(false);
      return;
    }
    
    // Only fetch profile once, or if we don't have one yet
    if (!profileFetchedRef.current) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [pathname, fetchProfile]);

  const navigation = profile ? getNavigation(profile.role) : [];
  const roleLabel =
    profile?.role === 'super_admin'
      ? 'Super Admin (Global)'
      : profile?.role === 'country_admin' && profile?.country
        ? `Country Admin (${profile.country})`
        : 'Admin';
  const initial = profile?.firstName?.[0] || profile?.email?.[0]?.toUpperCase() || 'A';

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-gradient-gold rounded-xl" />
          <p className="text-gray-500 font-medium">Loading admin...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-cream-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0F0F0F] transform transition-transform lg:translate-x-0 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/10 flex-shrink-0">
          <Logo href="/admin" className="h-8 w-auto" variant="dark" />
            <button
            type="button"
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-3 py-4 flex-1 min-h-0 flex flex-col overflow-hidden">
          <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex-shrink-0">
            Admin Panel
          </p>
          <nav className="space-y-1 overflow-y-auto flex-1 min-h-0" aria-label="Admin navigation">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-gradient-gold text-white shadow-gold'
                      : 'text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-white/10 flex-shrink-0">
          <button
            type="button"
            className="flex items-center gap-3 w-full px-3 py-2.5 text-gray-400 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
            onClick={() => {
              authApi.logout();
              router.replace('/admin/login');
              router.refresh();
            }}
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-white border-b border-cream-200 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2 w-80">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent border-none outline-none flex-1 text-sm"
                />
              </div>
              {profile.role === 'super_admin' && (
                <span className="text-sm text-green-700 bg-green-100 px-2 py-1 rounded font-medium">
                  Global Access
                </span>
              )}
              {profile.role === 'country_admin' && profile.country && (
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Country: {profile.country}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              <button type="button" className="relative p-2 text-gray-500 hover:text-gray-700">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="w-9 h-9 bg-gold-100 rounded-full flex items-center justify-center">
                  <span className="text-gold-600 font-semibold">{initial}</span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {profile.firstName ? `${profile.firstName} ${profile.lastName || ''}`.trim() : profile.email}
                  </p>
                  <p className="text-xs text-gray-500">{roleLabel}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8">
          <ToastProvider>
            {children}
          </ToastProvider>
        </main>
      </div>
    </div>
  );
}
