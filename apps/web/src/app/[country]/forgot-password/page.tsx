'use client';

import { useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-gray-400">Loading...</div></div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}

function ForgotPasswordContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const country = (params.country as 'in' | 'ae' | 'uk') || 'in';

  // Check if we're in "reset confirm" mode (user clicked email link with token)
  const resetToken = searchParams.get('token');

  if (resetToken) {
    return <ResetPasswordForm country={country} token={resetToken} />;
  }

  return <RequestResetForm country={country} />;
}

/* ------------------------------------------------------------------ */
/*  Step 1: Request password reset (enter email)                        */
/* ------------------------------------------------------------------ */

function RequestResetForm({ country }: { country: string }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError('');

    try {
      await api.post('/api/auth/password/reset', { email: email.trim().toLowerCase() });
      setSent(true);
    } catch (err: unknown) {
      // The API returns success even if no account exists (security best practice)
      // So if we get here, it's likely a network error
      const message = err && typeof err === 'object' && 'message' in err
        ? (err as { message: string }).message
        : 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <main className="min-h-screen bg-cream-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-cream-200 p-8 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Check your email</h1>
            <p className="text-gray-600 mt-2">
              If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link.
              Please check your inbox and spam folder.
            </p>
            <p className="text-sm text-gray-400 mt-4">
              The link will expire in 1 hour.
            </p>
            <div className="mt-6 space-y-3">
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="w-full py-3 text-sm text-gold-600 hover:bg-gold-50 rounded-lg transition-colors font-medium"
              >
                Try a different email
              </button>
              <Link
                href={`/${country}/login`}
                className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 font-medium text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream-50 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-cream-200 p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-7 h-7 text-gold-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Reset your password</h1>
            <p className="text-gray-600 mt-2 text-sm">
              Enter the email address associated with your account and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
                className="w-full px-4 py-3 border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full py-3 bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send reset link'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href={`/${country}/login`}
              className="inline-flex items-center gap-2 text-gold-600 hover:text-gold-700 font-medium text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-cream-200">
            <p className="text-xs text-gray-400 text-center">
              Need help? Contact us at{' '}
              <a href="mailto:Info@thegrandgold.com" className="text-gold-600 hover:text-gold-700">
                Info@thegrandgold.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 2: Confirm password reset (enter new password with token)      */
/* ------------------------------------------------------------------ */

function ResetPasswordForm({ country, token }: { country: string; token: string }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const passwordValid = password.length >= 8;
  const passwordsMatch = password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValid || !passwordsMatch) return;

    setLoading(true);
    setError('');

    try {
      await api.post('/api/auth/password/reset/confirm', {
        token,
        password,
        confirmPassword,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err
        ? (err as { message: string }).message
        : 'Failed to reset password. The link may have expired.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-cream-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-cream-200 p-8 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Password reset successful!</h1>
            <p className="text-gray-600 mt-2">
              Your password has been updated. You can now sign in with your new password.
            </p>
            <Link
              href={`/${country}/login`}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-600 text-white font-medium rounded-xl transition-colors"
            >
              Sign in now
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream-50 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-cream-200 p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-gold-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Create new password</h1>
            <p className="text-gray-600 mt-2 text-sm">
              Enter your new password below. Make sure it&apos;s at least 8 characters long.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                New password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                  autoFocus
                  className="w-full px-4 py-3 pr-12 border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {password && !passwordValid && (
                <p className="mt-1 text-xs text-red-500">Password must be at least 8 characters</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm new password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  className="w-full px-4 py-3 pr-12 border border-cream-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-700">{error}</p>
                  {error.includes('expired') && (
                    <Link
                      href={`/${country}/forgot-password`}
                      className="text-sm text-red-600 underline mt-1 block"
                    >
                      Request a new reset link
                    </Link>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !passwordValid || !passwordsMatch}
              className="w-full py-3 bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset password'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href={`/${country}/login`}
              className="inline-flex items-center gap-2 text-gold-600 hover:text-gold-700 font-medium text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
