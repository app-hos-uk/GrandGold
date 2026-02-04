'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Send,
  Phone,
  Video,
  MoreVertical,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Bot,
  Zap,
  ArrowRight,
  Paperclip,
  Smile,
  X,
  ChevronDown,
  Search,
  Settings,
} from 'lucide-react';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';
import { formatRelativeDate } from '@/lib/format';

interface ChatSession {
  id: string;
  customer: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    country: string;
  };
  status: 'waiting' | 'active' | 'resolved';
  assignee?: string;
  startedAt: string;
  lastMessageAt: string;
  unreadCount: number;
  messages: ChatMessage[];
  context?: {
    currentPage?: string;
    cartValue?: number;
    recentOrders?: string[];
  };
}

interface ChatMessage {
  id: string;
  sender: 'customer' | 'agent' | 'bot';
  senderName: string;
  content: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
}

const MOCK_SESSIONS: ChatSession[] = [
  {
    id: 'CHAT-001',
    customer: { id: 'C1', name: 'Priya Sharma', email: 'priya@email.com', country: 'IN' },
    status: 'active',
    assignee: 'You',
    startedAt: '2024-02-03T14:30:00Z',
    lastMessageAt: '2024-02-03T14:35:00Z',
    unreadCount: 2,
    messages: [
      { id: 'm1', sender: 'customer', senderName: 'Priya', content: 'Hi, I need help with my order', timestamp: '2024-02-03T14:30:00Z', status: 'read' },
      { id: 'm2', sender: 'bot', senderName: 'AI Assistant', content: 'Hello Priya! I\'d be happy to help. Let me connect you with an agent.', timestamp: '2024-02-03T14:30:30Z', status: 'read' },
      { id: 'm3', sender: 'agent', senderName: 'You', content: 'Hi Priya! I\'m here to help. Can you share your order number?', timestamp: '2024-02-03T14:32:00Z', status: 'read' },
      { id: 'm4', sender: 'customer', senderName: 'Priya', content: 'Yes, it\'s ORD-2024-1234. The tracking hasn\'t updated in 3 days.', timestamp: '2024-02-03T14:35:00Z', status: 'delivered' },
    ],
    context: { currentPage: '/IN/account/orders', cartValue: 0, recentOrders: ['ORD-2024-1234'] },
  },
  {
    id: 'CHAT-002',
    customer: { id: 'C2', name: 'Ahmed Hassan', email: 'ahmed@email.com', country: 'AE' },
    status: 'waiting',
    startedAt: '2024-02-03T14:38:00Z',
    lastMessageAt: '2024-02-03T14:38:00Z',
    unreadCount: 1,
    messages: [
      { id: 'm1', sender: 'customer', senderName: 'Ahmed', content: 'Is this 22K gold necklace available for delivery to Dubai?', timestamp: '2024-02-03T14:38:00Z' },
    ],
    context: { currentPage: '/AE/product/nkl-001', cartValue: 125000 },
  },
  {
    id: 'CHAT-003',
    customer: { id: 'C3', name: 'Sarah Williams', email: 'sarah@email.com', country: 'UK' },
    status: 'active',
    assignee: 'John Smith',
    startedAt: '2024-02-03T14:20:00Z',
    lastMessageAt: '2024-02-03T14:34:00Z',
    unreadCount: 0,
    messages: [
      { id: 'm1', sender: 'customer', senderName: 'Sarah', content: 'What\'s your return policy for custom items?', timestamp: '2024-02-03T14:20:00Z' },
      { id: 'm2', sender: 'agent', senderName: 'John Smith', content: 'Custom-made items have a different policy. Let me explain...', timestamp: '2024-02-03T14:22:00Z' },
    ],
  },
];

const QUICK_REPLIES = [
  'Thank you for contacting GrandGold! How can I help you today?',
  'Let me check that for you. One moment please.',
  'I\'ve found your order. Here are the details:',
  'Is there anything else I can help you with?',
  'I\'m transferring you to a specialist who can better assist.',
];

const AI_SUGGESTIONS = [
  { text: 'Order is delayed due to customs. ETA: 2 days.', confidence: 95 },
  { text: 'Offer 10% discount for inconvenience', confidence: 78 },
  { text: 'Escalate to logistics team', confidence: 65 },
];

export default function LiveChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>(MOCK_SESSIONS);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(MOCK_SESSIONS[0]);
  const [messageInput, setMessageInput] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [agentStatus, setAgentStatus] = useState<'online' | 'busy' | 'away'>('online');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const waitingCount = sessions.filter((s) => s.status === 'waiting').length;
  const activeCount = sessions.filter((s) => s.status === 'active').length;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages]);

  const handleSendMessage = () => {
    if (!activeSession || !messageInput.trim()) return;

    const newMessage: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: 'agent',
      senderName: 'You',
      content: messageInput,
      timestamp: new Date().toISOString(),
      status: 'sent',
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id
          ? { ...s, messages: [...s.messages, newMessage], lastMessageAt: new Date().toISOString() }
          : s
      )
    );
    setActiveSession((prev) =>
      prev ? { ...prev, messages: [...prev.messages, newMessage] } : prev
    );
    setMessageInput('');
  };

  const handleAcceptChat = (sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId ? { ...s, status: 'active', assignee: 'You' } : s
      )
    );
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      setActiveSession({ ...session, status: 'active', assignee: 'You' });
    }
  };

  const handleResolve = (sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId ? { ...s, status: 'resolved' } : s
      )
    );
    if (activeSession?.id === sessionId) {
      setActiveSession(null);
    }
  };

  const statusColors = {
    online: 'bg-green-500',
    busy: 'bg-red-500',
    away: 'bg-yellow-500',
  };

  return (
    <div className="h-[calc(100vh-120px)]">
      <AdminBreadcrumbs items={[{ label: 'Support', href: '/admin/support' }, { label: 'Live Chat' }]} />

      <div className="flex gap-4 h-full mt-4">
        {/* Sessions List */}
        <div className="w-80 bg-white rounded-xl shadow-sm flex flex-col">
          {/* Agent Status */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Live Chats</h2>
              <div className="relative">
                <button
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm"
                >
                  <div className={`w-2 h-2 rounded-full ${statusColors[agentStatus]}`} />
                  <span className="capitalize">{agentStatus}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span className="text-gray-600">{waitingCount} waiting</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4 text-green-500" />
                <span className="text-gray-600">{activeCount} active</span>
              </div>
            </div>
          </div>

          {/* Session Tabs */}
          <div className="flex border-b border-gray-100">
            <button className="flex-1 py-2 text-sm font-medium text-gold-600 border-b-2 border-gold-500">
              All ({sessions.length})
            </button>
            <button className="flex-1 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
              My Chats
            </button>
          </div>

          {/* Sessions */}
          <div className="flex-1 overflow-y-auto">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => setActiveSession(session)}
                className={`p-4 border-b border-gray-50 cursor-pointer transition-colors ${
                  activeSession?.id === session.id ? 'bg-gold-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gold-100 rounded-full flex items-center justify-center">
                      <span className="text-gold-600 font-semibold text-sm">
                        {session.customer.name.charAt(0)}
                      </span>
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                      session.status === 'waiting' ? 'bg-yellow-500' : session.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 text-sm">{session.customer.name}</p>
                      {session.unreadCount > 0 && (
                        <span className="w-5 h-5 bg-gold-500 text-white text-xs rounded-full flex items-center justify-center">
                          {session.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{session.customer.country}</p>
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {session.messages[session.messages.length - 1]?.content}
                    </p>
                  </div>
                </div>
                {session.status === 'waiting' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAcceptChat(session.id); }}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-gold-500 text-white text-sm rounded-lg hover:bg-gold-600"
                  >
                    Accept Chat
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        {activeSession ? (
          <div className="flex-1 bg-white rounded-xl shadow-sm flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gold-100 rounded-full flex items-center justify-center">
                  <span className="text-gold-600 font-semibold">{activeSession.customer.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{activeSession.customer.name}</p>
                  <p className="text-sm text-gray-500">{activeSession.customer.email} · {activeSession.customer.country}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg" title="Voice Call">
                  <Phone className="w-5 h-5 text-gray-500" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg" title="Video Call">
                  <Video className="w-5 h-5 text-gray-500" />
                </button>
                {activeSession.status === 'active' && (
                  <button
                    onClick={() => handleResolve(activeSession.id)}
                    className="px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded-lg hover:bg-green-200 flex items-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Resolve
                  </button>
                )}
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <MoreVertical className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {activeSession.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'customer' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      msg.sender === 'customer'
                        ? 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                        : msg.sender === 'bot'
                        ? 'bg-purple-100 text-purple-900 rounded-br-md'
                        : 'bg-gold-500 text-white rounded-br-md'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {msg.sender === 'bot' && <Bot className="w-4 h-4" />}
                      <span className={`text-xs ${msg.sender === 'agent' ? 'text-gold-100' : 'text-gray-500'}`}>
                        {msg.senderName}
                      </span>
                    </div>
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.sender === 'agent' ? 'text-gold-200' : 'text-gray-400'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* AI Suggestions */}
            <div className="px-4 py-2 border-t border-gray-100 bg-purple-50">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-medium text-purple-600">AI Suggestions</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {AI_SUGGESTIONS.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setMessageInput(suggestion.text)}
                    className="flex-shrink-0 px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-sm text-purple-800 hover:bg-purple-100"
                  >
                    {suggestion.text.substring(0, 40)}... ({suggestion.confidence}%)
                  </button>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-100">
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setShowQuickReplies(!showQuickReplies)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Quick Replies
                </button>
              </div>
              <AnimatePresence>
                {showQuickReplies && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-2 flex flex-wrap gap-2"
                  >
                    {QUICK_REPLIES.map((reply, i) => (
                      <button
                        key={i}
                        onClick={() => { setMessageInput(reply); setShowQuickReplies(false); }}
                        className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200"
                      >
                        {reply.substring(0, 30)}...
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex gap-2">
                <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Paperclip className="w-5 h-5 text-gray-500" />
                </button>
                <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Smile className="w-5 h-5 text-gray-500" />
                </button>
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-white rounded-xl shadow-sm flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Chat Selected</h3>
              <p className="text-gray-500">Select a conversation from the left panel</p>
            </div>
          </div>
        )}

        {/* Customer Context Panel */}
        {activeSession && (
          <div className="w-72 bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Customer Context</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Current Page</p>
                <p className="text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
                  {activeSession.context?.currentPage || 'Unknown'}
                </p>
              </div>

              {activeSession.context?.cartValue !== undefined && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Cart Value</p>
                  <p className="text-sm font-semibold text-gray-900">
                    ₹{activeSession.context.cartValue.toLocaleString()}
                  </p>
                </div>
              )}

              {activeSession.context?.recentOrders && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Recent Orders</p>
                  <div className="space-y-1">
                    {activeSession.context.recentOrders.map((orderId) => (
                      <a
                        key={orderId}
                        href={`/admin/orders?order=${orderId}`}
                        className="block text-sm text-gold-600 hover:text-gold-700 font-mono"
                      >
                        {orderId}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Quick Actions</p>
                <div className="space-y-2">
                  <button className="w-full text-left text-sm text-gray-700 hover:text-gold-600 py-1">
                    → View Order History
                  </button>
                  <button className="w-full text-left text-sm text-gray-700 hover:text-gold-600 py-1">
                    → Create Ticket
                  </button>
                  <button className="w-full text-left text-sm text-gray-700 hover:text-gold-600 py-1">
                    → Transfer Chat
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
