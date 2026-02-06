'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Package,
  ChevronRight,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Sparkles,
  Download,
  ArrowLeft,
  MapPin,
  CreditCard,
  RotateCcw,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { api } from '@/lib/api';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface OrderItem {
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  purity?: string;
  weight?: string;
  sku?: string;
}

interface OrderTimeline {
  status: string;
  timestamp: string;
  description?: string;
}

interface ShippingAddress {
  name?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
}

interface Order {
  id: string;
  date: string;
  total: number;
  subtotal?: number;
  tax?: number;
  shipping?: number;
  discount?: number;
  status: string;
  items: OrderItem[];
  tracking?: string;
  trackingUrl?: string;
  carrier?: string;
  deliveredDate?: string;
  estimatedDelivery?: string;
  cancelledDate?: string;
  cancelReason?: string;
  createdAt?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  shippingAddress?: ShippingAddress;
  timeline?: OrderTimeline[];
}

/* ------------------------------------------------------------------ */
/*  Config                                                              */
/* ------------------------------------------------------------------ */

const statusConfig: Record<string, { icon: typeof CheckCircle; label: string; color: string; bg: string }> = {
  delivered: { icon: CheckCircle, label: 'Delivered', color: 'text-green-600', bg: 'bg-green-100' },
  processing: { icon: Clock, label: 'Processing', color: 'text-blue-600', bg: 'bg-blue-100' },
  pending: { icon: Clock, label: 'Pending', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  shipped: { icon: Truck, label: 'Shipped', color: 'text-purple-600', bg: 'bg-purple-100' },
  cancelled: { icon: XCircle, label: 'Cancelled', color: 'text-red-600', bg: 'bg-red-100' },
  returned: { icon: RotateCcw, label: 'Returned', color: 'text-orange-600', bg: 'bg-orange-100' },
  confirmed: { icon: CheckCircle, label: 'Confirmed', color: 'text-emerald-600', bg: 'bg-emerald-100' },
};

const countryConfig = {
  in: { currency: '₹' },
  ae: { currency: 'AED ' },
  uk: { currency: '£' },
};

/* ------------------------------------------------------------------ */
/*  Timeline step ordering                                              */
/* ------------------------------------------------------------------ */

const TIMELINE_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

function getTimelineStepIndex(status: string) {
  const idx = TIMELINE_STEPS.indexOf(status.toLowerCase());
  return idx >= 0 ? idx : -1;
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function OrderDetailPage() {
  const params = useParams();
  const country = (params.country as 'in' | 'ae' | 'uk') || 'in';
  const orderId = params.id as string;
  const config = countryConfig[country];

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedTracking, setCopiedTracking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchOrder() {
      setLoading(true);
      setError(null);
      try {
        const result = await api.get<Order | { data: Order }>(`/api/orders/${orderId}`);
        if (cancelled) return;
        // Handle { data: Order } or Order directly
        const orderData = result && typeof result === 'object' && 'data' in result
          ? (result as { data: Order }).data
          : result as Order;
        setOrder(orderData);
      } catch (err: unknown) {
        if (cancelled) return;
        const status = err && typeof err === 'object' && 'status' in err ? (err as { status: number }).status : 0;
        if (status === 401) {
          setError('login');
        } else if (status === 404) {
          setError('not_found');
        } else {
          setError('error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchOrder();
    return () => { cancelled = true; };
  }, [orderId]);

  const formatPrice = (price: number) => `${config.currency}${price.toLocaleString()}`;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const handleCopyTracking = () => {
    if (order?.tracking) {
      navigator.clipboard.writeText(order.tracking);
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2000);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/invoice`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('grandgold_token') || localStorage.getItem('accessToken') || ''}`,
        },
      });
      if (!res.ok) throw new Error('Invoice not available');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${orderId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(`/api/orders/${orderId}/invoice`, '_blank');
    }
  };

  // Current step in timeline
  const currentStepIdx = order ? getTimelineStepIndex(order.status) : -1;
  const isCancelled = order?.status === 'cancelled' || order?.status === 'returned';

  // Loading
  if (loading) {
    return (
      <main className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
          <span className="text-gray-500">Loading order details...</span>
        </div>
      </main>
    );
  }

  // Login required
  if (error === 'login') {
    return (
      <main className="min-h-screen bg-cream-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Sign in to view order</h1>
          <p className="text-gray-600 mb-6">You need to be logged in to view order details.</p>
          <Link href={`/${country}/login`} className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition-colors">
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  // Not found
  if (error === 'not_found' || (!order && !loading)) {
    return (
      <main className="min-h-screen bg-cream-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Order not found</h1>
          <p className="text-gray-600 mb-6">We couldn&apos;t find order <strong>{orderId}</strong>.</p>
          <Link href={`/${country}/account/orders`} className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Link>
        </div>
      </main>
    );
  }

  // Generic error
  if (error || !order) {
    return (
      <main className="min-h-screen bg-cream-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-6">We couldn&apos;t load this order. Please try again.</p>
          <Link href={`/${country}/account/orders`} className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Link>
        </div>
      </main>
    );
  }

  const sc = statusConfig[order.status] || statusConfig.processing;
  const StatusIcon = sc.icon;

  return (
    <main className="min-h-screen bg-cream-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-cream-200">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link href={`/${country}/account`} className="text-gray-500 hover:text-gold-600">
              My Account
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <Link href={`/${country}/account/orders`} className="text-gray-500 hover:text-gold-600">
              Orders
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium">{order.id}</span>
          </nav>
        </div>
      </div>

      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Back link */}
            <Link
              href={`/${country}/account/orders`}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gold-600 text-sm font-medium mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Orders
            </Link>

            {/* Order Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 mb-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-semibold text-gray-900">Order {order.id}</h1>
                    <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${sc.color} ${sc.bg}`}>
                      <StatusIcon className="w-4 h-4" />
                      {sc.label}
                    </span>
                  </div>
                  <p className="text-gray-500">
                    Placed on {formatDate(order.createdAt || order.date)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDownloadInvoice}
                    className="flex items-center gap-2 px-4 py-2 border border-cream-200 hover:border-gold-500 rounded-lg text-sm font-medium text-gray-700 hover:text-gold-600 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Invoice
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Order Timeline (visual progress) */}
            {!isCancelled && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-white rounded-2xl p-6 mb-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Progress</h2>
                <div className="relative">
                  {/* Progress bar background */}
                  <div className="absolute top-5 left-5 right-5 h-0.5 bg-cream-200" />
                  {/* Active progress bar */}
                  <div
                    className="absolute top-5 left-5 h-0.5 bg-gold-500 transition-all duration-500"
                    style={{
                      width: currentStepIdx >= 0
                        ? `${Math.min((currentStepIdx / (TIMELINE_STEPS.length - 1)) * 100, 100)}%`
                        : '0%',
                    }}
                  />

                  <div className="relative flex justify-between">
                    {TIMELINE_STEPS.map((step, idx) => {
                      const isActive = idx <= currentStepIdx;
                      const isCurrent = idx === currentStepIdx;
                      return (
                        <div key={step} className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                              isActive
                                ? 'bg-gold-500 border-gold-500 text-white'
                                : 'bg-white border-cream-300 text-gray-400'
                            } ${isCurrent ? 'ring-4 ring-gold-100' : ''}`}
                          >
                            {isActive ? (
                              <Check className="w-5 h-5" />
                            ) : (
                              <span className="text-xs font-medium">{idx + 1}</span>
                            )}
                          </div>
                          <span className={`mt-2 text-xs font-medium capitalize ${isActive ? 'text-gold-700' : 'text-gray-400'}`}>
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Delivery info */}
                <div className="mt-6 pt-4 border-t border-cream-100">
                  {order.status === 'delivered' && order.deliveredDate && (
                    <p className="text-sm text-green-600 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Delivered on {formatDate(order.deliveredDate)}
                    </p>
                  )}
                  {(order.status === 'shipped' || order.status === 'processing') && order.estimatedDelivery && (
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-gold-500" />
                      Estimated delivery: {formatDate(order.estimatedDelivery)}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Cancelled banner */}
            {isCancelled && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6"
              >
                <div className="flex items-start gap-3">
                  <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-800">
                      Order {order.status === 'returned' ? 'Returned' : 'Cancelled'}
                    </h3>
                    {order.cancelledDate && (
                      <p className="text-sm text-red-600 mt-1">
                        {order.status === 'returned' ? 'Returned' : 'Cancelled'} on {formatDate(order.cancelledDate)}
                      </p>
                    )}
                    {order.cancelReason && (
                      <p className="text-sm text-red-700 mt-1">Reason: {order.cancelReason}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tracking info */}
            {order.tracking && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-6 mb-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-gold-500" />
                  Tracking
                </h2>
                <div className="flex items-center gap-4">
                  <div>
                    {order.carrier && (
                      <p className="text-sm text-gray-500 mb-1">Carrier: {order.carrier}</p>
                    )}
                    <p className="font-mono text-gray-900 font-medium">{order.tracking}</p>
                  </div>
                  <button
                    onClick={handleCopyTracking}
                    className="p-2 hover:bg-cream-100 rounded-lg transition-colors"
                    title="Copy tracking number"
                  >
                    {copiedTracking ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  {order.trackingUrl && (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Track Package
                    </a>
                  )}
                </div>
              </motion.div>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Order Items */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="lg:col-span-2 bg-white rounded-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-cream-100">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Items ({order.items.length})
                  </h2>
                </div>
                <div className="divide-y divide-cream-100">
                  {order.items.map((item, i) => (
                    <div key={i} className="p-6 flex items-start gap-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-cream-100 to-cream-200 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-10 h-10 text-gold-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {item.productId ? (
                          <Link
                            href={`/${country}/product/${item.productId}`}
                            className="font-medium text-gray-900 hover:text-gold-600 transition-colors"
                          >
                            {item.name}
                          </Link>
                        ) : (
                          <p className="font-medium text-gray-900">{item.name}</p>
                        )}
                        <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
                          {item.purity && <span>Purity: {item.purity}</span>}
                          {item.weight && <span>Weight: {item.weight}</span>}
                          {item.sku && <span>SKU: {item.sku}</span>}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatPrice(item.price)}</p>
                        {item.quantity > 1 && (
                          <p className="text-sm text-gray-500">
                            {formatPrice(item.price * item.quantity)} total
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Order Summary sidebar */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                {/* Price breakdown */}
                <div className="bg-white rounded-2xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>
                  <div className="space-y-3 text-sm">
                    {order.subtotal != null && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Subtotal</span>
                        <span className="text-gray-900">{formatPrice(order.subtotal)}</span>
                      </div>
                    )}
                    {order.shipping != null && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Shipping</span>
                        <span className="text-gray-900">
                          {order.shipping === 0 ? 'Free' : formatPrice(order.shipping)}
                        </span>
                      </div>
                    )}
                    {order.tax != null && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tax</span>
                        <span className="text-gray-900">{formatPrice(order.tax)}</span>
                      </div>
                    )}
                    {order.discount != null && order.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-{formatPrice(order.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-3 border-t border-cream-200 font-semibold text-base">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">{formatPrice(order.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment info */}
                {order.paymentMethod && (
                  <div className="bg-white rounded-2xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-gold-500" />
                      Payment
                    </h3>
                    <p className="text-sm text-gray-600">{order.paymentMethod}</p>
                    {order.paymentStatus && (
                      <p className={`text-sm mt-1 capitalize ${
                        order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {order.paymentStatus}
                      </p>
                    )}
                  </div>
                )}

                {/* Shipping address */}
                {order.shippingAddress && (
                  <div className="bg-white rounded-2xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-gold-500" />
                      Delivery Address
                    </h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      {order.shippingAddress.name && (
                        <p className="font-medium text-gray-900">{order.shippingAddress.name}</p>
                      )}
                      {order.shippingAddress.line1 && <p>{order.shippingAddress.line1}</p>}
                      {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                      <p>
                        {[order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.postalCode]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                      {order.shippingAddress.country && <p>{order.shippingAddress.country}</p>}
                      {order.shippingAddress.phone && (
                        <p className="mt-2">Phone: {order.shippingAddress.phone}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Timeline / activity log */}
                {order.timeline && order.timeline.length > 0 && (
                  <div className="bg-white rounded-2xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Activity</h3>
                    <div className="space-y-4">
                      {order.timeline.map((entry, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="relative">
                            <div className={`w-3 h-3 rounded-full mt-1.5 ${
                              i === 0 ? 'bg-gold-500' : 'bg-cream-300'
                            }`} />
                            {i < order.timeline!.length - 1 && (
                              <div className="absolute left-1.5 top-4 w-px h-full -translate-x-1/2 bg-cream-200" />
                            )}
                          </div>
                          <div className="pb-4">
                            <p className="text-sm font-medium text-gray-900 capitalize">{entry.status}</p>
                            {entry.description && (
                              <p className="text-xs text-gray-500 mt-0.5">{entry.description}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">{formatDate(entry.timestamp)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Help */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mt-6 bg-cream-100 rounded-2xl p-6 text-center"
            >
              <p className="text-gray-600">
                Need help with this order?{' '}
                <a
                  href="mailto:Info@thegrandgold.com"
                  className="text-gold-600 hover:text-gold-700 font-medium"
                >
                  Contact Support
                </a>
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}
