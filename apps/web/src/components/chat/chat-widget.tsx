'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Minimize2, User } from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { api } from '@/lib/api';
import { ProactiveChat } from './proactive-chat';
import { VoiceInput } from './voice-input';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const STORAGE_KEY = 'grandgold_chat_history';

function getStoredMessages(): Message[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { content: string; role: string; timestamp: string }[];
    return parsed.slice(-20).map((m, i) => ({
      id: `stored-${i}`,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      timestamp: new Date(m.timestamp),
    }));
  } catch {
    return [];
  }
}

function storeMessages(messages: Message[]) {
  if (typeof window === 'undefined') return;
  try {
    const toStore = messages.slice(-20).map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp.toISOString(),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch {
    // ignore
  }
}

const RESPONSES: Record<string, string> = {
  price: "Our prices are based on live market rates for gold, silver, and platinum. You'll see the current price on each product page.",
  order: "You can track your order from your account dashboard. We offer standard (5-7 days) and express (2-3 days) delivery.",
  return: "We have a 15-day easy return policy. Custom-made items are non-returnable. Initiate a return from your order details page.",
  kyc: "KYC (identity verification) is required for higher transaction limits. Tier 1 (email + phone) allows smaller purchases.",
  gold: "All our gold is BIS hallmarked and certified. We offer 22K, 18K, and 24K purity.",
  help: "For immediate help, visit our FAQ or contact support. We typically respond within 2 hours during business hours.",
  hello: "Hello! I'm GrandGold's assistant. I can help with product info, pricing, orders, returns, and more.",
  human: "I'll connect you with a support agent. Our team typically responds within 2 hours. You can also call us or request a callback from the contact page.",
  default: "Thanks for your message. For detailed assistance, please check our FAQ or contact support.",
};

/** Simple mock responses - wire to AI service later */
function getMockResponse(query: string): string {
  const q = query.toLowerCase();
  if (q.includes('price') || q.includes('pricing') || q.includes('cost')) return RESPONSES.price;
  if (q.includes('order') || q.includes('tracking') || q.includes('delivery') || q.includes('shipping')) return RESPONSES.order;
  if (q.includes('return') || q.includes('refund') || q.includes('exchange')) return RESPONSES.return;
  if (q.includes('kyc') || q.includes('verify') || q.includes('identity')) return RESPONSES.kyc;
  if (q.includes('gold') || q.includes('purity') || q.includes('hallmark') || q.includes('22k') || q.includes('24k')) return RESPONSES.gold;
  if (q.includes('human') || q.includes('agent') || q.includes('person')) return RESPONSES.human;
  if (q.includes('help') || q.includes('support') || q.includes('contact')) return RESPONSES.help;
  if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('namaste')) return RESPONSES.hello;
  return RESPONSES.default;
}

export function ChatWidget() {
  const cart = useCart();
  const itemCount = cart?.itemCount ?? 0;
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      setMessages(getStoredMessages());
      mounted.current = true;
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) storeMessages(messages);
  }, [messages]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    setInput('');
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((m) => [...m, userMsg]);
    setIsTyping(true);

    let reply: string;
    try {
      const history = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));
      const result = await api.post<{ reply: string }>('/api/ai/chat', { message: text, history });
      reply = result?.reply ?? getMockResponse(text);
    } catch {
      reply = getMockResponse(text);
    }
    const assistantMsg: Message = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      content: reply,
      timestamp: new Date(),
    };
    setMessages((m) => [...m, assistantMsg]);
    setIsTyping(false);
  };

  return (
    <>
      <ProactiveChat
        itemCount={itemCount}
        isChatOpen={isOpen}
        onOpen={() => setIsOpen(true)}
      />
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gold-500 hover:bg-gold-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gold-600 focus:ring-offset-2"
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        aria-expanded={isOpen}
      >
        {isOpen ? <Minimize2 className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[min(400px,calc(100vw-48px))] h-[min(500px,70vh)] bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gold-500 text-white">
            <h3 className="font-semibold">GrandGold Support</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-lg"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div
            ref={listRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
          >
            {messages.length === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-3">
                  Ask about products, pricing, orders, returns, or KYC.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    const userMsg: Message = {
                      id: `u-${Date.now()}`,
                      role: 'user',
                      content: 'I need to talk to a human agent',
                      timestamp: new Date(),
                    };
                    setMessages((m) => [...m, userMsg]);
                    setIsTyping(true);
                    let reply: string;
                    try {
                      const result = await api.post<{ reply: string }>('/api/ai/chat', { message: 'I need to talk to a human agent', history: [] });
                      reply = result?.reply ?? getMockResponse('human');
                    } catch {
                      reply = getMockResponse('human');
                    }
                    setMessages((m) => [
                      ...m,
                      {
                        id: `a-${Date.now()}`,
                        role: 'assistant' as const,
                        content: reply,
                        timestamp: new Date(),
                      },
                    ]);
                    setIsTyping(false);
                  }}
                  className="flex items-center gap-2 mx-auto text-sm text-gold-600 hover:text-gold-700"
                >
                  <User className="w-4 h-4" />
                  Talk to human agent
                </button>
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${
                    m.role === 'user'
                      ? 'bg-gold-500 text-white rounded-br-md'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="px-4 py-2 rounded-2xl rounded-bl-md bg-white border border-gray-200 text-gray-500 text-sm">
                  <span className="animate-pulse">Typing...</span>
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-4 border-t border-gray-200 bg-white"
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
                placeholder="Type or speak your question..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="p-2 bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-white rounded-xl transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
