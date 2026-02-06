'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MessageCircle,
  X,
  Send,
  Minimize2,
  User,
  Sparkles,
  TrendingUp,
  Gift,
  ShoppingBag,
  ChevronRight,
  RotateCcw,
  Bot,
  ExternalLink,
} from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { api } from '@/lib/api';
import { ProactiveChat } from './proactive-chat';
import { VoiceInput } from './voice-input';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface ProductCard {
  id: string;
  name: string;
  slug?: string;
  price: number;
  purity: string;
  metalType: string;
  category: string;
  weight: string;
  inStock: boolean;
}

interface NavigateAction {
  label: string;
  path: string;
  type: 'product' | 'category' | 'page';
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  products?: ProductCard[];
  suggestions?: string[];
  type?: string;
  navigateActions?: NavigateAction[];
}

interface AIResponse {
  reply: string;
  success?: boolean;
  products?: ProductCard[];
  suggestions?: string[];
  type?: string;
  navigateActions?: NavigateAction[];
}

/* ------------------------------------------------------------------ */
/*  Persistence                                                         */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = 'grandgold_chat_history';
const GOLD_RATES_CACHE_KEY = 'grandgold_chat_gold_rates';

function getStoredMessages(): Message[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<{ content: string; role: string; timestamp: string; products?: ProductCard[]; suggestions?: string[]; type?: string; navigateActions?: NavigateAction[] }>;
    return parsed.slice(-30).map((m, i) => ({
      id: `stored-${i}`,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      timestamp: new Date(m.timestamp),
      products: m.products,
      suggestions: m.suggestions,
      type: m.type,
      navigateActions: m.navigateActions,
    }));
  } catch {
    return [];
  }
}

function storeMessages(messages: Message[]) {
  if (typeof window === 'undefined') return;
  try {
    const toStore = messages.slice(-30).map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp.toISOString(),
      products: m.products,
      suggestions: m.suggestions,
      type: m.type,
      navigateActions: m.navigateActions,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch {
    // ignore
  }
}

function getCachedGoldRates(): Record<string, number> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(GOLD_RATES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { rates: Record<string, number>; expires: number };
    if (parsed.expires > Date.now()) return parsed.rates;
    return null;
  } catch {
    return null;
  }
}

function cacheGoldRates(rates: Record<string, number>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GOLD_RATES_CACHE_KEY, JSON.stringify({ rates, expires: Date.now() + 5 * 60 * 1000 }));
  } catch {
    // ignore
  }
}

/* ------------------------------------------------------------------ */
/*  Simple markdown-to-JSX renderer                                     */
/* ------------------------------------------------------------------ */

function RichText({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Heading ##
    if (line.startsWith('## ')) {
      elements.push(
        <p key={i} className="font-semibold text-sm text-gray-900 mt-1 mb-1">
          {renderInline(line.slice(3))}
        </p>
      );
      continue;
    }

    // Table lines (| ... |)
    if (line.trim().startsWith('|')) {
      // collect full table
      const tableLines: string[] = [];
      let j = i;
      while (j < lines.length && lines[j].trim().startsWith('|')) {
        tableLines.push(lines[j]);
        j++;
      }
      elements.push(<SimpleTable key={i} rows={tableLines} />);
      i = j - 1;
      continue;
    }

    // Bullet points
    if (line.match(/^[-•]\s/)) {
      elements.push(
        <p key={i} className="text-xs text-gray-700 pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-gold-500">
          {renderInline(line.replace(/^[-•]\s/, ''))}
        </p>
      );
      continue;
    }

    // Horizontal rule
    if (line.trim() === '---') {
      elements.push(<hr key={i} className="my-2 border-gray-200" />);
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      elements.push(<div key={i} className="h-1" />);
      continue;
    }

    // Normal text
    elements.push(
      <p key={i} className="text-xs text-gray-700">
        {renderInline(line)}
      </p>
    );
  }

  return <>{elements}</>;
}

/** Render bold, italic, emoji inline */
function renderInline(text: string): React.ReactNode {
  // Split on **bold** and _italic_ patterns
  const parts = text.split(/(\*\*[^*]+\*\*|_[^_]+_)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('_') && part.endsWith('_')) {
      return <em key={i} className="italic text-gray-500">{part.slice(1, -1)}</em>;
    }
    return <span key={i}>{part}</span>;
  });
}

/** Simple table renderer */
function SimpleTable({ rows }: { rows: string[] }) {
  const parsed = rows
    .filter((r) => !r.match(/^\|\s*[-|]+\s*\|$/)) // skip separator rows
    .map((r) =>
      r.split('|').filter(Boolean).map((c) => c.trim())
    );
  if (parsed.length === 0) return null;
  const header = parsed[0];
  const body = parsed.slice(1);

  return (
    <div className="overflow-x-auto my-1">
      <table className="text-[10px] w-full border-collapse">
        <thead>
          <tr>
            {header.map((h, i) => (
              <th key={i} className="px-1.5 py-1 bg-gold-50 text-gold-800 font-semibold text-left border-b border-gold-200">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-1.5 py-1 border-b border-gray-100">
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Product card component                                              */
/* ------------------------------------------------------------------ */

function ProductCardRow({ product, country }: { product: ProductCard; country: string }) {
  const metalLabels: Record<string, string> = {
    gold: 'Gold',
    white_gold: 'White Gold',
    rose_gold: 'Rose Gold',
    platinum: 'Platinum',
    silver: 'Silver',
  };

  return (
    <Link
      href={`/${country}/product/${product.id}`}
      className="flex items-center gap-3 p-2 rounded-lg bg-white border border-gray-100 hover:border-gold-300 hover:shadow-sm transition-all group"
    >
      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gold-100 to-cream-200 flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-5 h-5 text-gold-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-900 truncate group-hover:text-gold-700 transition-colors">
          {product.name}
        </p>
        <p className="text-[10px] text-gray-500">
          {product.purity} {metalLabels[product.metalType] || product.metalType} • {product.weight}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xs font-semibold text-gold-700">₹{product.price.toLocaleString('en-IN')}</p>
        {product.inStock ? (
          <p className="text-[10px] text-green-600">In Stock</p>
        ) : (
          <p className="text-[10px] text-red-500">Sold Out</p>
        )}
      </div>
      <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0 group-hover:text-gold-500 transition-colors" />
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Quick suggestion chips                                              */
/* ------------------------------------------------------------------ */

function SuggestionChips({ suggestions, onSelect }: { suggestions: string[]; onSelect: (text: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {suggestions.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className="px-2.5 py-1 text-[11px] bg-gold-50 text-gold-700 rounded-full border border-gold-200 hover:bg-gold-100 hover:border-gold-300 transition-colors whitespace-nowrap"
        >
          {s}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Navigation action buttons                                           */
/* ------------------------------------------------------------------ */

function NavigateButtons({ actions, country, onNavigate }: { actions: NavigateAction[]; country: string; onNavigate: () => void }) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {actions.map((action) => (
        <button
          key={action.path}
          onClick={() => {
            router.push(`/${country}${action.path}`);
            onNavigate();
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors shadow-sm"
        >
          <ExternalLink className="w-3 h-3" />
          {action.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Welcome screen                                                      */
/* ------------------------------------------------------------------ */

function WelcomeScreen({ onSelect }: { onSelect: (text: string) => void }) {
  const quickActions = [
    { icon: Gift, label: 'Gift Suggestions', query: 'Help me find a gift', color: 'bg-pink-50 text-pink-600 border-pink-200' },
    { icon: TrendingUp, label: 'Gold Price Trends', query: 'Gold price trends', color: 'bg-green-50 text-green-600 border-green-200' },
    { icon: ShoppingBag, label: 'Browse Bestsellers', query: 'Show me bestsellers', color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { icon: Sparkles, label: 'Wedding Jewelry', query: 'Wedding jewelry suggestions', color: 'bg-gold-50 text-gold-600 border-gold-200' },
  ];

  return (
    <div className="px-2 py-3">
      <div className="text-center mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-gold-400 to-gold-600 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">GrandGold AI Advisor</h3>
        <p className="text-[11px] text-gray-500 mt-0.5">
          Your personal jewelry consultant — gifting, pricing, trends & more
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => onSelect(action.query)}
            className={`flex items-center gap-2 p-2.5 rounded-xl border text-left hover:shadow-sm transition-all ${action.color}`}
          >
            <action.icon className="w-4 h-4 flex-shrink-0" />
            <span className="text-[11px] font-medium">{action.label}</span>
          </button>
        ))}
      </div>

      <div className="space-y-1">
        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider px-1">Popular questions</p>
        {[
          'Birthday gift under ₹50,000',
          'Engagement ring suggestions',
          "What's today's gold rate?",
          'Diwali gold shopping guide',
        ].map((q) => (
          <button
            key={q}
            onClick={() => onSelect(q)}
            className="w-full flex items-center gap-2 px-2.5 py-2 text-left text-xs text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
            {q}
          </button>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={() => onSelect('I need to talk to a human agent')}
          className="w-full flex items-center justify-center gap-2 py-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          <User className="w-3.5 h-3.5" />
          Talk to a human agent
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main ChatWidget                                                     */
/* ------------------------------------------------------------------ */

export function ChatWidget() {
  const params = useParams();
  const country = (params?.country as string) || 'in';
  const cart = useCart();
  const itemCount = cart?.itemCount ?? 0;
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [goldRates, setGoldRates] = useState<Record<string, number> | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  // Restore messages on mount
  useEffect(() => {
    if (!mounted.current) {
      setMessages(getStoredMessages());
      mounted.current = true;
    }
  }, []);

  // Persist messages
  useEffect(() => {
    if (messages.length > 0) storeMessages(messages);
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    if (listRef.current) {
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
      });
    }
  }, [messages, isTyping]);

  // Fetch gold rates when chat opens (cached 5 min)
  useEffect(() => {
    if (!isOpen) return;
    const cached = getCachedGoldRates();
    if (cached) {
      setGoldRates(cached);
      return;
    }
    fetch('/api/rates/metals')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { gold?: Record<string, number> } | null) => {
        if (data?.gold) {
          setGoldRates(data.gold);
          cacheGoldRates(data.gold);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setInput('');
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((m) => [...m, userMsg]);
    setIsTyping(true);

    try {
      const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));
      const result = await api.post<AIResponse>('/api/ai/chat', {
        message: trimmed,
        history,
        country,
        goldRates: goldRates || undefined,
      });

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: result?.reply || "I'm here to help! Could you rephrase your question?",
        timestamp: new Date(),
        products: result?.products,
        suggestions: result?.suggestions,
        type: result?.type,
        navigateActions: result?.navigateActions,
      };
      setMessages((m) => [...m, assistantMsg]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: 'assistant' as const,
          content: "I'm having trouble connecting right now. Please try again in a moment, or contact us at Info@thegrandgold.com.",
          timestamp: new Date(),
          suggestions: ['Try again', 'Contact support'],
        },
      ]);
    }
    setIsTyping(false);
  }, [messages, country, goldRates]);

  const handleClearChat = () => {
    setMessages([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <>
      <ProactiveChat itemCount={itemCount} isChatOpen={isOpen} onOpen={() => setIsOpen(true)} />

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gold-600 focus:ring-offset-2"
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        aria-expanded={isOpen}
      >
        {isOpen ? <Minimize2 className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[min(420px,calc(100vw-32px))] h-[min(580px,75vh)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">GrandGold AI</h3>
                <p className="text-[10px] text-gold-100">Jewelry Advisor</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={handleClearChat}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Clear chat"
                  title="Clear chat"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
            {messages.length === 0 ? (
              <WelcomeScreen onSelect={(q) => sendMessage(q)} />
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] ${m.role === 'user' ? '' : ''}`}>
                    {/* Avatar + Bubble */}
                    <div className="flex gap-2 items-start">
                      {m.role === 'assistant' && (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div
                        className={`px-3 py-2 rounded-2xl ${
                          m.role === 'user'
                            ? 'bg-gold-500 text-white rounded-br-md text-xs'
                            : 'bg-white border border-gray-200 rounded-bl-md shadow-sm'
                        }`}
                      >
                        {m.role === 'user' ? (
                          <span className="text-xs">{m.content}</span>
                        ) : (
                          <RichText text={m.content} />
                        )}
                      </div>
                    </div>

                    {/* Product cards */}
                    {m.products && m.products.length > 0 && (
                      <div className="mt-2 ml-8 space-y-1.5">
                        {m.products.slice(0, 4).map((p) => (
                          <ProductCardRow key={p.id} product={p} country={country} />
                        ))}
                        {m.products.length > 4 && (
                          <p className="text-[10px] text-gray-400 pl-2">
                            +{m.products.length - 4} more available
                          </p>
                        )}
                      </div>
                    )}

                    {/* Navigation action buttons */}
                    {m.navigateActions && m.navigateActions.length > 0 && m.role === 'assistant' && (
                      <div className="ml-8">
                        <NavigateButtons actions={m.navigateActions} country={country} onNavigate={() => setIsOpen(false)} />
                      </div>
                    )}

                    {/* Suggestion chips */}
                    {m.suggestions && m.suggestions.length > 0 && m.role === 'assistant' && (
                      <div className="ml-8">
                        <SuggestionChips suggestions={m.suggestions} onSelect={(q) => sendMessage(q)} />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {isTyping && (
              <div className="flex justify-start">
                <div className="flex gap-2 items-start">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <div className="px-3 py-2 rounded-2xl rounded-bl-md bg-white border border-gray-200 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="p-3 border-t border-gray-200 bg-white"
          >
            <div className="flex gap-2">
              <VoiceInput
                onTranscript={(t) => setInput((prev) => (prev ? `${prev} ${t}` : t))}
                disabled={isTyping}
              />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about gifts, gold rates, trends..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent placeholder:text-gray-400"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="p-2 bg-gradient-to-br from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 disabled:opacity-50 text-white rounded-xl transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[9px] text-gray-400 text-center mt-1.5">
              GrandGold AI Advisor — Gifting, Pricing, Trends & Product Guidance
            </p>
          </form>
        </div>
      )}
    </>
  );
}
