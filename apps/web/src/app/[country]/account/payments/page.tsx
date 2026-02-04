'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Plus, Trash2, Star, Loader2, CheckCircle, AlertCircle, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SavedCard {
  id: string;
  type: 'visa' | 'mastercard' | 'amex' | 'rupay';
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  holderName: string;
  isDefault: boolean;
}

interface SavedUPI {
  id: string;
  vpa: string;
  isDefault: boolean;
}

const CARD_ICONS: Record<string, string> = {
  visa: '💳',
  mastercard: '💳',
  amex: '💳',
  rupay: '💳',
};

export default function PaymentsPage() {
  const params = useParams();
  const country = (params.country as 'in' | 'ae' | 'uk') || 'in';

  const [cards, setCards] = useState<SavedCard[]>([]);
  const [upiAccounts, setUpiAccounts] = useState<SavedUPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingCard, setAddingCard] = useState(false);
  const [addingUPI, setAddingUPI] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    holderName: '',
    setDefault: false,
  });

  const [upiForm, setUpiForm] = useState({
    vpa: '',
    setDefault: false,
  });

  useEffect(() => {
    // Fetch saved payment methods
    const fetchPaymentMethods = async () => {
      try {
        const token = localStorage.getItem('grandgold_token');
        const res = await fetch('/api/payments/saved', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setCards(data?.data?.cards || data?.cards || []);
          setUpiAccounts(data?.data?.upi || data?.upi || []);
        }
      } catch {
        // Use empty state
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentMethods();
  }, []);

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!cardForm.cardNumber || cardForm.cardNumber.replace(/\s/g, '').length < 15) {
      setError('Please enter a valid card number');
      return;
    }
    if (!cardForm.expiryMonth || !cardForm.expiryYear) {
      setError('Please enter expiry date');
      return;
    }
    if (!cardForm.cvv || cardForm.cvv.length < 3) {
      setError('Please enter CVV');
      return;
    }
    if (!cardForm.holderName.trim()) {
      setError('Please enter cardholder name');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('grandgold_token');
      const res = await fetch('/api/payments/saved/card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          cardNumber: cardForm.cardNumber.replace(/\s/g, ''),
          expiryMonth: cardForm.expiryMonth,
          expiryYear: cardForm.expiryYear,
          cvv: cardForm.cvv,
          holderName: cardForm.holderName,
          setDefault: cardForm.setDefault,
        }),
      });

      if (!res.ok) throw new Error('Failed to save card');

      const data = await res.json();
      const newCard = data?.data || data;

      // Simulate saved card for demo
      const simulatedCard: SavedCard = newCard?.id ? newCard : {
        id: String(Date.now()),
        type: cardForm.cardNumber.startsWith('4') ? 'visa' : 'mastercard',
        last4: cardForm.cardNumber.slice(-4),
        expiryMonth: cardForm.expiryMonth,
        expiryYear: cardForm.expiryYear,
        holderName: cardForm.holderName,
        isDefault: cardForm.setDefault || cards.length === 0,
      };

      if (simulatedCard.isDefault) {
        setCards((prev) => prev.map((c) => ({ ...c, isDefault: false })));
      }
      setCards((prev) => [...prev, simulatedCard]);

      setSuccess('Card saved successfully');
      setAddingCard(false);
      setCardForm({ cardNumber: '', expiryMonth: '', expiryYear: '', cvv: '', holderName: '', setDefault: false });
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Failed to save card. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddUPI = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!upiForm.vpa || !upiForm.vpa.includes('@')) {
      setError('Please enter a valid UPI ID (e.g., name@upi)');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('grandgold_token');
      await fetch('/api/payments/saved/upi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          vpa: upiForm.vpa,
          setDefault: upiForm.setDefault,
        }),
      });

      const newUPI: SavedUPI = {
        id: String(Date.now()),
        vpa: upiForm.vpa,
        isDefault: upiForm.setDefault || upiAccounts.length === 0,
      };

      if (newUPI.isDefault) {
        setUpiAccounts((prev) => prev.map((u) => ({ ...u, isDefault: false })));
      }
      setUpiAccounts((prev) => [...prev, newUPI]);

      setSuccess('UPI ID saved successfully');
      setAddingUPI(false);
      setUpiForm({ vpa: '', setDefault: false });
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Failed to save UPI ID. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (!confirm('Remove this card?')) return;

    try {
      await fetch(`/api/payments/saved/card/${id}`, { method: 'DELETE' });
      setCards((prev) => prev.filter((c) => c.id !== id));
      setSuccess('Card removed');
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Failed to remove card');
    }
  };

  const handleDeleteUPI = async (id: string) => {
    if (!confirm('Remove this UPI ID?')) return;

    try {
      await fetch(`/api/payments/saved/upi/${id}`, { method: 'DELETE' });
      setUpiAccounts((prev) => prev.filter((u) => u.id !== id));
      setSuccess('UPI ID removed');
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Failed to remove UPI ID');
    }
  };

  const handleSetDefault = async (type: 'card' | 'upi', id: string) => {
    try {
      await fetch(`/api/payments/saved/${type}/${id}/default`, { method: 'POST' });
      if (type === 'card') {
        setCards((prev) => prev.map((c) => ({ ...c, isDefault: c.id === id })));
      } else {
        setUpiAccounts((prev) => prev.map((u) => ({ ...u, isDefault: u.id === id })));
      }
      setSuccess('Default payment method updated');
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Failed to update default');
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
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

        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Payment Methods</h1>

        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 p-4 mb-6 bg-green-50 text-green-700 rounded-lg"
            >
              <CheckCircle className="w-5 h-5" />
              <span>{success}</span>
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 p-4 mb-6 bg-red-50 text-red-700 rounded-lg"
            >
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
          </div>
        ) : (
          <>
            {/* Saved Cards */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <h2 className="font-semibold text-gray-900">Saved Cards</h2>
                </div>
                {!addingCard && (
                  <button
                    onClick={() => setAddingCard(true)}
                    className="flex items-center gap-1 text-sm text-gold-600 hover:text-gold-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Card
                  </button>
                )}
              </div>

              {cards.length === 0 && !addingCard && (
                <p className="text-gray-500 text-sm py-4">No saved cards. Add a card for faster checkout.</p>
              )}

              <div className="space-y-3">
                {cards.map((card) => (
                  <div key={card.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{CARD_ICONS[card.type] || '💳'}</span>
                      <div>
                        <p className="font-medium text-gray-900">
                          •••• •••• •••• {card.last4}
                          {card.isDefault && (
                            <span className="ml-2 text-xs bg-gold-100 text-gold-700 px-2 py-0.5 rounded-full">
                              Default
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">
                          {card.holderName} · Expires {card.expiryMonth}/{card.expiryYear}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!card.isDefault && (
                        <button
                          onClick={() => handleSetDefault('card', card.id)}
                          className="p-2 text-gray-400 hover:text-gold-500"
                          title="Set as default"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="p-2 text-gray-400 hover:text-red-500"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Card Form */}
              <AnimatePresence>
                {addingCard && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleAddCard}
                    className="mt-4 p-4 border border-gray-200 rounded-lg space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                      <input
                        type="text"
                        value={cardForm.cardNumber}
                        onChange={(e) => setCardForm((f) => ({ ...f, cardNumber: formatCardNumber(e.target.value) }))}
                        maxLength={19}
                        placeholder="1234 5678 9012 3456"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                        <select
                          value={cardForm.expiryMonth}
                          onChange={(e) => setCardForm((f) => ({ ...f, expiryMonth: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                        >
                          <option value="">MM</option>
                          {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                        <select
                          value={cardForm.expiryYear}
                          onChange={(e) => setCardForm((f) => ({ ...f, expiryYear: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                        >
                          <option value="">YY</option>
                          {Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() + i).slice(-2)).map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                        <input
                          type="password"
                          value={cardForm.cvv}
                          onChange={(e) => setCardForm((f) => ({ ...f, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                          maxLength={4}
                          placeholder="•••"
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        value={cardForm.holderName}
                        onChange={(e) => setCardForm((f) => ({ ...f, holderName: e.target.value }))}
                        placeholder="Name on card"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={cardForm.setDefault}
                        onChange={(e) => setCardForm((f) => ({ ...f, setDefault: e.target.checked }))}
                        className="rounded text-gold-500"
                      />
                      <span className="text-sm text-gray-600">Set as default payment method</span>
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setAddingCard(false)}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                        Save Card
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            {/* UPI (India only) */}
            {country === 'in' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-gray-400" />
                    <h2 className="font-semibold text-gray-900">UPI IDs</h2>
                  </div>
                  {!addingUPI && (
                    <button
                      onClick={() => setAddingUPI(true)}
                      className="flex items-center gap-1 text-sm text-gold-600 hover:text-gold-700"
                    >
                      <Plus className="w-4 h-4" />
                      Add UPI
                    </button>
                  )}
                </div>

                {upiAccounts.length === 0 && !addingUPI && (
                  <p className="text-gray-500 text-sm py-4">No saved UPI IDs. Add one for instant payments.</p>
                )}

                <div className="space-y-3">
                  {upiAccounts.map((upi) => (
                    <div key={upi.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {upi.vpa}
                          {upi.isDefault && (
                            <span className="ml-2 text-xs bg-gold-100 text-gold-700 px-2 py-0.5 rounded-full">
                              Default
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!upi.isDefault && (
                          <button
                            onClick={() => handleSetDefault('upi', upi.id)}
                            className="p-2 text-gray-400 hover:text-gold-500"
                            title="Set as default"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUPI(upi.id)}
                          className="p-2 text-gray-400 hover:text-red-500"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add UPI Form */}
                <AnimatePresence>
                  {addingUPI && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleAddUPI}
                      className="mt-4 p-4 border border-gray-200 rounded-lg space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
                        <input
                          type="text"
                          value={upiForm.vpa}
                          onChange={(e) => setUpiForm((f) => ({ ...f, vpa: e.target.value }))}
                          placeholder="yourname@upi"
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                        />
                      </div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={upiForm.setDefault}
                          onChange={(e) => setUpiForm((f) => ({ ...f, setDefault: e.target.checked }))}
                          className="rounded text-gold-500"
                        />
                        <span className="text-sm text-gray-600">Set as default</span>
                      </label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setAddingUPI(false)}
                          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="flex-1 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                          Save UPI
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
