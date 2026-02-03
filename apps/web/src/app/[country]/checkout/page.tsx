'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import {
  ArrowLeft,
  Shield,
  CreditCard,
  MapPin,
  Truck,
  Loader2,
  Lock,
  Check,
  ChevronDown,
  Building2,
  Smartphone,
  Banknote,
  AlertCircle,
} from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { stripeApi, razorpayApi, checkoutApi } from '@/lib/api';

const countryConfig = {
  in: { currency: '₹', currencyCode: 'INR', country: 'IN', paymentProvider: 'razorpay' as const },
  ae: { currency: 'AED ', currencyCode: 'AED', country: 'AE', paymentProvider: 'stripe' as const },
  uk: { currency: '£', currencyCode: 'GBP', country: 'UK', paymentProvider: 'stripe' as const },
};

interface ShippingAddress {
  firstName: string;
  lastName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
}

type PaymentMethod = 'card' | 'upi' | 'netbanking' | 'cod';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh',
];

const UAE_EMIRATES = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'];

const UK_REGIONS = ['England', 'Scotland', 'Wales', 'Northern Ireland'];

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const country = (params.country as 'in' | 'ae' | 'uk') || 'in';
  const config = countryConfig[country];
  const { cart, isLoading: cartLoading, itemCount, cartId } = useCart();

  const [step, setStep] = useState<'address' | 'payment' | 'processing' | 'success'>('address');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Address state
  const [address, setAddress] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
  });
  const [addressErrors, setAddressErrors] = useState<Partial<ShippingAddress>>({});

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [savedCards, setSavedCards] = useState<Array<{ id: string; brand: string; last4: string; expMonth: number; expYear: number }>>([]);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [banks, setBanks] = useState<Array<{ code: string; name: string }>>([]);

  // Card form state (for new cards)
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [saveCard, setSaveCard] = useState(false);

  useEffect(() => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('grandgold_token') || localStorage.getItem('accessToken')
        : null;
    setIsLoggedIn(!!token);
    setIsCheckingAuth(false);

    // Load saved cards for Stripe users
    if (token && config.paymentProvider === 'stripe') {
      stripeApi.getSavedCards().then(setSavedCards).catch(() => {});
    }

    // Load banks for Razorpay users
    if (config.paymentProvider === 'razorpay') {
      razorpayApi.getBanks().then(setBanks).catch(() => {});
    }
  }, [config.paymentProvider]);

  const formatPrice = (price: number) =>
    `${config.currency}${price.toLocaleString()}`;

  const getRegions = () => {
    switch (country) {
      case 'in': return INDIAN_STATES;
      case 'ae': return UAE_EMIRATES;
      case 'uk': return UK_REGIONS;
      default: return [];
    }
  };

  const validateAddress = (): boolean => {
    const errors: Partial<ShippingAddress> = {};
    if (!address.firstName.trim()) errors.firstName = 'First name is required';
    if (!address.lastName.trim()) errors.lastName = 'Last name is required';
    if (!address.phone.trim()) errors.phone = 'Phone is required';
    if (!address.line1.trim()) errors.line1 = 'Address is required';
    if (!address.city.trim()) errors.city = 'City is required';
    if (!address.state) errors.state = 'State/Region is required';
    if (!address.postalCode.trim()) errors.postalCode = 'Postal code is required';
    
    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddressSubmit = () => {
    if (validateAddress()) {
      setStep('payment');
    }
  };

  const subtotal = cart?.subtotal ?? 0;
  const taxRate = country === 'in' ? 0.03 : country === 'ae' ? 0.05 : 0.2;
  const tax = Math.round(subtotal * taxRate);
  const shipping = subtotal > 50000 ? 0 : 500;
  const total = subtotal + tax + shipping;

  // Handle Razorpay payment
  const handleRazorpayPayment = useCallback(async () => {
    try {
      setIsProcessing(true);
      setError(null);

      // Create order first
      const orderResponse = await checkoutApi.createOrder({
        cartId: cartId || '',
        shippingAddress: { ...address, country: config.country },
        paymentMethod: 'razorpay',
      });

      setOrderId(orderResponse.orderId);

      // Create Razorpay order
      const razorpayOrder = await razorpayApi.createOrder({
        amount: total * 100, // Razorpay expects paise
        currency: config.currencyCode,
        receipt: orderResponse.orderId,
      });

      // Initialize Razorpay
      const options = {
        key: razorpayOrder.keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'GrandGold',
        description: 'Jewellery Purchase',
        order_id: razorpayOrder.orderId,
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          try {
            // Verify payment
            await razorpayApi.verifyPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });

            // Complete order
            await checkoutApi.completeOrder(orderResponse.orderId, {
              paymentId: response.razorpay_payment_id,
              provider: 'razorpay',
            });

            setStep('success');
          } catch (err) {
            setError('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: `${address.firstName} ${address.lastName}`,
          contact: address.phone,
        },
        theme: {
          color: '#D4A853',
        },
        method: {
          upi: paymentMethod === 'upi',
          netbanking: paymentMethod === 'netbanking',
          card: paymentMethod === 'card',
          wallet: false,
        },
      };

      const razorpay = new (window as unknown as { Razorpay: new (opts: unknown) => { open: () => void } }).Razorpay(options);
      razorpay.open();
    } catch (err) {
      setError('Failed to initiate payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [address, cartId, config, paymentMethod, total]);

  // Handle Stripe payment
  const handleStripePayment = useCallback(async () => {
    try {
      setIsProcessing(true);
      setError(null);

      // Create order first
      const orderResponse = await checkoutApi.createOrder({
        cartId: cartId || '',
        shippingAddress: { ...address, country: config.country },
        paymentMethod: 'stripe',
      });

      setOrderId(orderResponse.orderId);

      // Create payment intent
      const intent = await stripeApi.createPaymentIntent({
        amount: Math.round(total * 100), // Stripe expects smallest currency unit
        currency: config.currencyCode.toLowerCase(),
        metadata: { orderId: orderResponse.orderId },
      });

      // If using saved card
      if (selectedCard) {
        const result = await stripeApi.confirmPayment({
          paymentIntentId: intent.paymentIntentId,
          paymentMethodId: selectedCard,
        });

        if (result.status === 'succeeded') {
          await checkoutApi.completeOrder(orderResponse.orderId, {
            paymentId: result.paymentId,
            provider: 'stripe',
          });
          setStep('success');
        } else {
          setError('Payment failed. Please try again.');
        }
      } else {
        // For new cards, we would typically use Stripe Elements here
        // This is a simplified version - in production use @stripe/react-stripe-js
        setError('Please use a saved card or add card details via Stripe Elements.');
      }
    } catch (err) {
      setError('Failed to process payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [address, cartId, config, selectedCard, total]);

  // Handle COD
  const handleCODPayment = useCallback(async () => {
    try {
      setIsProcessing(true);
      setError(null);

      const orderResponse = await checkoutApi.createOrder({
        cartId: cartId || '',
        shippingAddress: { ...address, country: config.country },
        paymentMethod: 'cod',
      });

      setOrderId(orderResponse.orderId);
      setStep('success');
    } catch (err) {
      setError('Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [address, cartId, config]);

  const handlePayment = () => {
    if (paymentMethod === 'cod') {
      handleCODPayment();
    } else if (config.paymentProvider === 'razorpay') {
      handleRazorpayPayment();
    } else {
      handleStripePayment();
    }
  };

  if (isCheckingAuth || cartLoading) {
    return (
      <main className="min-h-screen bg-cream-50 py-20 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-gold-500 animate-spin" />
      </main>
    );
  }

  if (itemCount === 0) {
    return (
      <main className="min-h-screen bg-cream-50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h1>
            <p className="text-gray-600 mb-8">Add items to your cart to proceed to checkout.</p>
            <Link
              href={`/${country}/collections`}
              className="inline-flex items-center gap-2 px-8 py-3 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-cream-50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center">
            <Lock className="w-16 h-16 text-gold-500 mx-auto mb-6" />
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Sign in to checkout</h1>
            <p className="text-gray-600 mb-8">Please sign in or create an account to complete your purchase.</p>
            <Link
              href={`/${country}/login?redirect=${encodeURIComponent(`/${country}/checkout`)}`}
              className="inline-flex items-center gap-2 px-8 py-3 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (step === 'success') {
    return (
      <main className="min-h-screen bg-cream-50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Order Placed Successfully!</h1>
            <p className="text-gray-600 mb-4">
              Thank you for your order. Your order ID is: <strong>{orderId}</strong>
            </p>
            <p className="text-gray-500 text-sm mb-8">
              You will receive an email confirmation shortly with order details.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href={`/${country}/account/orders`}
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition-colors"
              >
                View Order
              </Link>
              <Link
                href={`/${country}/collections`}
                className="inline-flex items-center justify-center gap-2 px-8 py-3 border border-gold-500 text-gold-600 font-medium rounded-lg hover:bg-gold-50 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      {/* Razorpay Script */}
      {config.paymentProvider === 'razorpay' && (
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      )}

      <main className="min-h-screen bg-cream-50">
        <div className="container mx-auto px-4 py-8">
          <Link
            href={`/${country}/cart`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gold-600 mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Cart
          </Link>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${step === 'address' ? 'text-gold-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'address' ? 'bg-gold-500 text-white' : step === 'payment' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>
                  {step === 'payment' ? <Check className="w-4 h-4" /> : '1'}
                </div>
                <span className="font-medium">Shipping</span>
              </div>
              <div className="w-12 h-px bg-gray-300" />
              <div className={`flex items-center gap-2 ${step === 'payment' ? 'text-gold-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'payment' ? 'bg-gold-500 text-white' : 'bg-gray-200'}`}>
                  2
                </div>
                <span className="font-medium">Payment</span>
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-semibold text-gray-900 mb-8">
            {step === 'address' ? 'Shipping Address' : 'Payment'}
          </h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              {step === 'address' && (
                <div className="bg-white rounded-2xl p-6">
                  <h2 className="font-semibold flex items-center gap-2 mb-6">
                    <MapPin className="w-5 h-5 text-gold-500" />
                    Delivery Address
                  </h2>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        value={address.firstName}
                        onChange={(e) => setAddress({ ...address, firstName: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${addressErrors.firstName ? 'border-red-500' : 'border-gray-200'}`}
                        placeholder="John"
                      />
                      {addressErrors.firstName && <p className="text-red-500 text-sm mt-1">{addressErrors.firstName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                      <input
                        type="text"
                        value={address.lastName}
                        onChange={(e) => setAddress({ ...address, lastName: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${addressErrors.lastName ? 'border-red-500' : 'border-gray-200'}`}
                        placeholder="Doe"
                      />
                      {addressErrors.lastName && <p className="text-red-500 text-sm mt-1">{addressErrors.lastName}</p>}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        value={address.phone}
                        onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${addressErrors.phone ? 'border-red-500' : 'border-gray-200'}`}
                        placeholder={country === 'in' ? '+91 98765 43210' : country === 'ae' ? '+971 50 123 4567' : '+44 7911 123456'}
                      />
                      {addressErrors.phone && <p className="text-red-500 text-sm mt-1">{addressErrors.phone}</p>}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
                      <input
                        type="text"
                        value={address.line1}
                        onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${addressErrors.line1 ? 'border-red-500' : 'border-gray-200'}`}
                        placeholder="House/Flat number, Street name"
                      />
                      {addressErrors.line1 && <p className="text-red-500 text-sm mt-1">{addressErrors.line1}</p>}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                      <input
                        type="text"
                        value={address.line2}
                        onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                        placeholder="Apartment, suite, building (optional)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                      <input
                        type="text"
                        value={address.city}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${addressErrors.city ? 'border-red-500' : 'border-gray-200'}`}
                        placeholder="City"
                      />
                      {addressErrors.city && <p className="text-red-500 text-sm mt-1">{addressErrors.city}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {country === 'in' ? 'State' : country === 'ae' ? 'Emirate' : 'Region'} *
                      </label>
                      <div className="relative">
                        <select
                          value={address.state}
                          onChange={(e) => setAddress({ ...address, state: e.target.value })}
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 appearance-none ${addressErrors.state ? 'border-red-500' : 'border-gray-200'}`}
                        >
                          <option value="">Select {country === 'in' ? 'State' : country === 'ae' ? 'Emirate' : 'Region'}</option>
                          {getRegions().map((region) => (
                            <option key={region} value={region}>{region}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                      {addressErrors.state && <p className="text-red-500 text-sm mt-1">{addressErrors.state}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {country === 'uk' ? 'Postcode' : 'PIN Code'} *
                      </label>
                      <input
                        type="text"
                        value={address.postalCode}
                        onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${addressErrors.postalCode ? 'border-red-500' : 'border-gray-200'}`}
                        placeholder={country === 'in' ? '400001' : country === 'uk' ? 'SW1A 1AA' : '00000'}
                      />
                      {addressErrors.postalCode && <p className="text-red-500 text-sm mt-1">{addressErrors.postalCode}</p>}
                    </div>
                  </div>

                  <button
                    onClick={handleAddressSubmit}
                    className="mt-6 w-full py-4 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    Continue to Payment
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                  </button>
                </div>
              )}

              {step === 'payment' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl p-6">
                    <h2 className="font-semibold flex items-center gap-2 mb-6">
                      <CreditCard className="w-5 h-5 text-gold-500" />
                      Payment Method
                    </h2>

                    <div className="space-y-3">
                      {/* Card Payment */}
                      <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors ${paymentMethod === 'card' ? 'border-gold-500 bg-gold-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'card'}
                          onChange={() => setPaymentMethod('card')}
                          className="w-5 h-5 text-gold-500"
                        />
                        <CreditCard className="w-6 h-6 text-gray-600" />
                        <div className="flex-1">
                          <p className="font-medium">Credit / Debit Card</p>
                          <p className="text-sm text-gray-500">Visa, Mastercard, Amex</p>
                        </div>
                      </label>

                      {/* UPI (India only) */}
                      {country === 'in' && (
                        <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors ${paymentMethod === 'upi' ? 'border-gold-500 bg-gold-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <input
                            type="radio"
                            name="payment"
                            checked={paymentMethod === 'upi'}
                            onChange={() => setPaymentMethod('upi')}
                            className="w-5 h-5 text-gold-500"
                          />
                          <Smartphone className="w-6 h-6 text-gray-600" />
                          <div className="flex-1">
                            <p className="font-medium">UPI</p>
                            <p className="text-sm text-gray-500">GPay, PhonePe, Paytm, BHIM</p>
                          </div>
                        </label>
                      )}

                      {/* Net Banking (India only) */}
                      {country === 'in' && (
                        <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors ${paymentMethod === 'netbanking' ? 'border-gold-500 bg-gold-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <input
                            type="radio"
                            name="payment"
                            checked={paymentMethod === 'netbanking'}
                            onChange={() => setPaymentMethod('netbanking')}
                            className="w-5 h-5 text-gold-500"
                          />
                          <Building2 className="w-6 h-6 text-gray-600" />
                          <div className="flex-1">
                            <p className="font-medium">Net Banking</p>
                            <p className="text-sm text-gray-500">All major banks supported</p>
                          </div>
                        </label>
                      )}

                      {/* Cash on Delivery */}
                      <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'border-gold-500 bg-gold-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'cod'}
                          onChange={() => setPaymentMethod('cod')}
                          className="w-5 h-5 text-gold-500"
                        />
                        <Banknote className="w-6 h-6 text-gray-600" />
                        <div className="flex-1">
                          <p className="font-medium">Cash on Delivery</p>
                          <p className="text-sm text-gray-500">Pay when you receive</p>
                        </div>
                      </label>
                    </div>

                    {/* Saved Cards (Stripe) */}
                    {paymentMethod === 'card' && config.paymentProvider === 'stripe' && savedCards.length > 0 && (
                      <div className="mt-6">
                        <p className="text-sm font-medium text-gray-700 mb-3">Saved Cards</p>
                        <div className="space-y-2">
                          {savedCards.map((card) => (
                            <label
                              key={card.id}
                              className={`flex items-center gap-4 p-3 border rounded-lg cursor-pointer ${selectedCard === card.id ? 'border-gold-500 bg-gold-50' : 'border-gray-200'}`}
                            >
                              <input
                                type="radio"
                                name="savedCard"
                                checked={selectedCard === card.id}
                                onChange={() => setSelectedCard(card.id)}
                                className="w-4 h-4 text-gold-500"
                              />
                              <div className="flex-1">
                                <p className="font-medium capitalize">{card.brand} •••• {card.last4}</p>
                                <p className="text-sm text-gray-500">Expires {card.expMonth}/{card.expYear}</p>
                              </div>
                            </label>
                          ))}
                          <label
                            className={`flex items-center gap-4 p-3 border rounded-lg cursor-pointer ${selectedCard === null ? 'border-gold-500 bg-gold-50' : 'border-gray-200'}`}
                          >
                            <input
                              type="radio"
                              name="savedCard"
                              checked={selectedCard === null}
                              onChange={() => setSelectedCard(null)}
                              className="w-4 h-4 text-gold-500"
                            />
                            <span className="font-medium">+ Use a new card</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* New Card Form */}
                    {paymentMethod === 'card' && (config.paymentProvider === 'razorpay' || selectedCard === null) && (
                      <div className="mt-6 p-4 bg-cream-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-3">
                          {config.paymentProvider === 'razorpay' 
                            ? 'You will be redirected to Razorpay to securely enter your card details.'
                            : 'Card details will be collected securely via Stripe.'}
                        </p>
                      </div>
                    )}

                    {/* UPI ID input */}
                    {paymentMethod === 'upi' && (
                      <div className="mt-4 p-4 bg-cream-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          You will be redirected to complete UPI payment via Razorpay.
                        </p>
                      </div>
                    )}

                    {/* Bank selection */}
                    {paymentMethod === 'netbanking' && banks.length > 0 && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Bank</label>
                        <select
                          value={selectedBank}
                          onChange={(e) => setSelectedBank(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                        >
                          <option value="">Select your bank</option>
                          {banks.map((bank) => (
                            <option key={bank.code} value={bank.code}>{bank.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* COD Notice */}
                    {paymentMethod === 'cod' && (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <strong>Note:</strong> For orders above {formatPrice(100000)}, Cash on Delivery is not available.
                          Please select an online payment method.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep('address')}
                      className="flex-1 py-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handlePayment}
                      disabled={isProcessing || (paymentMethod === 'cod' && total > 100000)}
                      className="flex-1 py-4 bg-gold-500 hover:bg-gold-600 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Lock className="w-5 h-5" />
                          {paymentMethod === 'cod' ? 'Place Order' : `Pay ${formatPrice(total)}`}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 sticky top-24">
                <h2 className="font-semibold mb-6">Order Summary</h2>

                {cart?.items?.map((item) => (
                  <div
                    key={item.productId}
                    className="flex gap-3 py-3 border-b border-cream-100 last:border-0"
                  >
                    <div className="w-16 h-16 bg-cream-100 rounded-lg flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-gray-500 text-sm">
                        Qty: {item.quantity} × {formatPrice(item.price)}
                      </p>
                    </div>
                    <p className="font-semibold text-sm">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}

                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax ({Math.round(taxRate * 100)}%)</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-cream-200">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                {step === 'payment' && (
                  <div className="mt-4 p-3 bg-cream-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Shipping to:</strong><br />
                      {address.firstName} {address.lastName}<br />
                      {address.line1}{address.line2 ? `, ${address.line2}` : ''}<br />
                      {address.city}, {address.state} {address.postalCode}
                    </p>
                  </div>
                )}

                <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>Secure checkout with SSL encryption</span>
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                  <Truck className="w-4 h-4 text-blue-500" />
                  <span>Free shipping on orders over {formatPrice(50000)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
