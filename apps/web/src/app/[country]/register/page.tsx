'use client';

import { Suspense, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { authApi, ApiError } from '@/lib/api';

const COUNTRY_OPTIONS = [
  { value: 'IN', label: 'India' },
  { value: 'AE', label: 'UAE' },
  { value: 'UK', label: 'UK' },
] as const;

function RegisterForm() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const country = (params.country as 'in' | 'ae' | 'uk') || 'in';
  const redirect = searchParams.get('redirect') || `/${country}/account`;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState<'IN' | 'AE' | 'UK'>(country.toUpperCase() as 'IN' | 'AE' | 'UK');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await authApi.register({
        email: email.trim().toLowerCase(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        country: countryCode,
        acceptedTerms: true,
        marketingConsent: false,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push(`/${country}/login?redirect=${encodeURIComponent(redirect)}`);
        router.refresh();
      }, 2000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Registration failed.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-cream-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto text-center bg-white rounded-2xl shadow-lg border border-cream-200 p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Account created</h1>
            <p className="text-gray-600 mt-2">Please sign in with your email and password.</p>
            <p className="text-sm text-gray-500 mt-4">Redirecting to sign in...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream-50 py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <div className="bg-white rounded-2xl shadow-lg border border-cream-200 overflow-hidden">
            <div className="bg-gradient-luxury px-6 py-8 text-center">
              <div className="w-14 h-14 bg-gradient-gold rounded-xl flex items-center justify-center mx-auto mb-4 shadow-gold">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-display font-semibold text-gray-900">Create account</h1>
              <p className="text-gray-600 mt-1">Join GrandGold for orders and wishlist</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-first" className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="reg-first"
                      type="text"
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="reg-last" className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                  <input
                    id="reg-last"
                    type="text"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="reg-phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="reg-phone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="reg-country" className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select
                  id="reg-country"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value as 'IN' | 'AE' | 'UK')}
                  className="w-full px-4 py-2.5 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  {COUNTRY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="reg-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-cream-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    placeholder="At least 8 characters"
                    minLength={8}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </button>
              <p className="text-center text-gray-600 text-sm">
                Already have an account?{' '}
                <Link href={`/${country}/login${redirect !== `/${country}/account` ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="text-gold-600 hover:text-gold-700 font-medium">
                  Sign in
                </Link>
              </p>
            </form>
          </div>
          <p className="text-center mt-6">
            <Link href={`/${country}`} className="text-gray-500 hover:text-gray-700 text-sm">
              ← Back to home
            </Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-cream-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
      </main>
    }>
      <RegisterForm />
    </Suspense>
  );
}
