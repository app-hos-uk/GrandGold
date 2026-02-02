'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Bell, Mail, Smartphone, MessageCircle, Check } from 'lucide-react';
import { api, notificationsApi, userApi } from '@/lib/api';

interface NotificationPrefs {
  email?: { orders?: boolean; promotions?: boolean; priceAlerts?: boolean; newsletter?: boolean };
  push?: { orders?: boolean; promotions?: boolean; priceAlerts?: boolean };
  whatsapp?: { orders?: boolean; promotions?: boolean };
}

const DEFAULT_PREFS: NotificationPrefs = {
  email: { orders: true, promotions: false, priceAlerts: true, newsletter: false },
  push: { orders: true, promotions: false, priceAlerts: true },
  whatsapp: { orders: false, promotions: false },
};

export default function NotificationsPage() {
  const params = useParams();
  const country = (params.country as 'in' | 'ae' | 'uk') || 'in';

  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [items, setItems] = useState<Array<{ id: string; type: string; title: string; body: string; read: boolean; createdAt: string; link?: string }>>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [prefsRes, notifRes] = await Promise.all([
          userApi.getPreferences().catch(() => null),
          notificationsApi.getList().catch(() => ({ items: [], unreadCount: 0 })),
        ]);
        if (prefsRes?.notifications) setPrefs((p) => ({ ...p, ...prefsRes.notifications } as NotificationPrefs));
        const data = notifRes as { items: typeof items; unreadCount: number };
        setItems(data?.items ?? []);
        setUnreadCount(data?.unreadCount ?? 0);
      } catch {
        setItems([]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const updatePref = async (path: string, value: boolean) => {
    const [channel, key] = path.split('.');
    setPrefs((p) => ({
      ...p,
      [channel]: { ...(p[channel as keyof NotificationPrefs] as object), [key]: value },
    }));
    setSaving(true);
    try {
      const next = { ...prefs, [channel]: { ...(prefs[channel as keyof NotificationPrefs] as object), [key]: value } };
      await userApi.updateNotificationPreferences(next as unknown as Record<string, unknown>);
    } catch {
      setPrefs((p) => ({ ...p, [channel]: { ...(p[channel as keyof NotificationPrefs] as object), [key]: !value } }));
    }
    setSaving(false);
  };

  const markRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  return (
    <main className="min-h-screen bg-cream-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link
          href={`/${country}/account`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gold-600 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Account
        </Link>

        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Notifications</h1>

        {/* Preferences */}
        <section className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-gold-500" />
            Notification Preferences
          </h2>
          <p className="text-sm text-gray-500 mb-6">Choose how you want to receive updates.</p>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </h3>
              <div className="space-y-2">
                {['orders', 'promotions', 'priceAlerts', 'newsletter'].map((key) => (
                  <label key={key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <input
                      type="checkbox"
                      checked={prefs.email?.[key as keyof typeof prefs.email] ?? false}
                      onChange={(e) => updatePref(`email.${key}`, e.target.checked)}
                      disabled={saving}
                      className="rounded border-gray-300 text-gold-600 focus:ring-gold-500"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Push Notifications
              </h3>
              <div className="space-y-2">
                {['orders', 'promotions', 'priceAlerts'].map((key) => (
                  <label key={key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <input
                      type="checkbox"
                      checked={prefs.push?.[key as keyof typeof prefs.push] ?? false}
                      onChange={(e) => updatePref(`push.${key}`, e.target.checked)}
                      disabled={saving}
                      className="rounded border-gray-300 text-gold-600 focus:ring-gold-500"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </h3>
              <div className="space-y-2">
                {['orders', 'promotions'].map((key) => (
                  <label key={key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">{key}</span>
                    <input
                      type="checkbox"
                      checked={prefs.whatsapp?.[key as keyof typeof prefs.whatsapp] ?? false}
                      onChange={(e) => updatePref(`whatsapp.${key}`, e.target.checked)}
                      disabled={saving}
                      className="rounded border-gray-300 text-gold-600 focus:ring-gold-500"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* In-app notifications */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-gray-900">Recent Notifications</h2>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-sm text-gold-600 hover:text-gold-700 flex items-center gap-1"
              >
                <Check className="w-4 h-4" />
                Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No notifications yet.</p>
          ) : (
            <div className="space-y-3">
              {items.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.read && markRead(n.id)}
                  className={`p-4 rounded-xl border ${
                    n.read ? 'bg-gray-50 border-gray-100' : 'bg-gold-50/30 border-gold-200'
                  }`}
                >
                  <p className="font-medium text-gray-900 text-sm">{n.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{n.body}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </p>
                  {n.link && (
                    <Link href={n.link} className="text-sm text-gold-600 hover:text-gold-700 mt-2 inline-block">
                      View →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
