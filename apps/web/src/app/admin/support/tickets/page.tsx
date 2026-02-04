'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Mail,
  Phone,
  MessageSquare,
  Eye,
  UserPlus,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Send,
  Loader2,
  Paperclip,
  MoreHorizontal,
  Calendar,
} from 'lucide-react';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';
import { formatRelativeDate } from '@/lib/format';
import { useToast } from '@/components/admin/toast';

interface Ticket {
  id: string;
  subject: string;
  description: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    country: string;
  };
  type: 'order' | 'return' | 'payment' | 'product' | 'account' | 'seller' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'pending' | 'in_progress' | 'resolved' | 'closed';
  channel: 'chat' | 'email' | 'phone' | 'whatsapp';
  assignee?: {
    id: string;
    name: string;
  };
  relatedOrderId?: string;
  tags: string[];
  messages: Array<{
    id: string;
    sender: 'customer' | 'agent' | 'system';
    senderName: string;
    content: string;
    timestamp: string;
    isInternal?: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

const MOCK_TICKETS: Ticket[] = [
  {
    id: 'TKT-2024-001',
    subject: 'Order not delivered - ORD-2024-1234',
    description: 'I ordered a gold necklace 10 days ago but haven\'t received it yet. Tracking shows it\'s stuck.',
    customer: { id: 'U1', name: 'Priya Sharma', email: 'priya@email.com', phone: '+91 98765 43210', country: 'IN' },
    type: 'order',
    priority: 'high',
    status: 'in_progress',
    channel: 'chat',
    assignee: { id: 'A1', name: 'Rahul Mehta' },
    relatedOrderId: 'ORD-2024-1234',
    tags: ['delivery', 'escalated'],
    messages: [
      { id: 'm1', sender: 'customer', senderName: 'Priya Sharma', content: 'I ordered a gold necklace 10 days ago but haven\'t received it yet.', timestamp: '2024-02-03T14:30:00Z' },
      { id: 'm2', sender: 'agent', senderName: 'Rahul Mehta', content: 'Hi Priya, I\'m looking into this for you. Can you confirm the order ID?', timestamp: '2024-02-03T14:35:00Z' },
      { id: 'm3', sender: 'customer', senderName: 'Priya Sharma', content: 'Yes, it\'s ORD-2024-1234', timestamp: '2024-02-03T14:36:00Z' },
    ],
    createdAt: '2024-02-03T14:30:00Z',
    updatedAt: '2024-02-03T14:36:00Z',
  },
  {
    id: 'TKT-2024-002',
    subject: 'Refund not received for cancelled order',
    description: 'I cancelled my order 5 days ago but the refund hasn\'t been processed yet.',
    customer: { id: 'U2', name: 'Ahmed Al-Farsi', email: 'ahmed@email.com', country: 'AE' },
    type: 'payment',
    priority: 'urgent',
    status: 'open',
    channel: 'email',
    tags: ['refund', 'urgent'],
    messages: [
      { id: 'm1', sender: 'customer', senderName: 'Ahmed Al-Farsi', content: 'I cancelled order ORD-2024-1150 on Jan 29 but haven\'t received my refund of AED 5,000.', timestamp: '2024-02-03T14:15:00Z' },
    ],
    createdAt: '2024-02-03T14:15:00Z',
    updatedAt: '2024-02-03T14:15:00Z',
  },
  {
    id: 'TKT-2024-003',
    subject: 'Wrong product received',
    description: 'Received diamond earrings instead of the gold bangles I ordered.',
    customer: { id: 'U3', name: 'James Wilson', email: 'james@email.com', phone: '+44 7911 123456', country: 'UK' },
    type: 'return',
    priority: 'high',
    status: 'pending',
    channel: 'phone',
    assignee: { id: 'A2', name: 'Sarah Khan' },
    relatedOrderId: 'ORD-2024-1180',
    tags: ['wrong-item', 'return'],
    messages: [
      { id: 'm1', sender: 'system', senderName: 'System', content: 'Ticket created from phone call', timestamp: '2024-02-03T13:45:00Z' },
      { id: 'm2', sender: 'agent', senderName: 'Sarah Khan', content: 'Customer reported receiving wrong item. Initiated return pickup.', timestamp: '2024-02-03T13:50:00Z', isInternal: true },
    ],
    createdAt: '2024-02-03T13:45:00Z',
    updatedAt: '2024-02-03T13:50:00Z',
  },
];

const AGENTS = [
  { id: 'A1', name: 'Rahul Mehta' },
  { id: 'A2', name: 'Sarah Khan' },
  { id: 'A3', name: 'John Smith' },
  { id: 'A4', name: 'Priya Patel' },
];

const priorityConfig = {
  low: { color: 'text-gray-600', bg: 'bg-gray-100' },
  medium: { color: 'text-blue-600', bg: 'bg-blue-100' },
  high: { color: 'text-orange-600', bg: 'bg-orange-100' },
  urgent: { color: 'text-red-600', bg: 'bg-red-100' },
};

const statusConfig = {
  open: { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Open' },
  pending: { color: 'text-purple-600', bg: 'bg-purple-100', label: 'Pending' },
  in_progress: { color: 'text-blue-600', bg: 'bg-blue-100', label: 'In Progress' },
  resolved: { color: 'text-green-600', bg: 'bg-green-100', label: 'Resolved' },
  closed: { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Closed' },
};

const channelConfig = {
  chat: { icon: MessageCircle, label: 'Chat' },
  email: { icon: Mail, label: 'Email' },
  phone: { icon: Phone, label: 'Phone' },
  whatsapp: { icon: MessageSquare, label: 'WhatsApp' },
};

const typeConfig = {
  order: 'Order Issue',
  return: 'Return/Exchange',
  payment: 'Payment Issue',
  product: 'Product Query',
  account: 'Account Issue',
  seller: 'Seller Issue',
  other: 'Other',
};

export default function TicketsPage() {
  const toast = useToast();
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.id.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.customer.name.toLowerCase().includes(q) ||
        t.customer.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 800));

    const newMessage = {
      id: `m-${Date.now()}`,
      sender: 'agent' as const,
      senderName: 'Support Agent',
      content: replyText,
      timestamp: new Date().toISOString(),
    };

    setTickets((prev) =>
      prev.map((t) =>
        t.id === selectedTicket.id
          ? { ...t, messages: [...t.messages, newMessage], status: 'in_progress', updatedAt: new Date().toISOString() }
          : t
      )
    );
    setSelectedTicket((prev) =>
      prev ? { ...prev, messages: [...prev.messages, newMessage], status: 'in_progress' } : prev
    );
    setReplyText('');
    setSending(false);
    toast.success('Reply sent');
  };

  const handleAssign = (ticketId: string, agentId: string) => {
    const agent = AGENTS.find((a) => a.id === agentId);
    if (!agent) return;

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId ? { ...t, assignee: agent, status: 'in_progress' } : t
      )
    );
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket((prev) => prev ? { ...prev, assignee: agent, status: 'in_progress' } : prev);
    }
    toast.success(`Assigned to ${agent.name}`);
  };

  const handleStatusChange = (ticketId: string, newStatus: Ticket['status']) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, status: newStatus, resolvedAt: newStatus === 'resolved' ? new Date().toISOString() : t.resolvedAt }
          : t
      )
    );
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket((prev) => prev ? { ...prev, status: newStatus } : prev);
    }
    toast.success(`Status updated to ${statusConfig[newStatus].label}`);
  };

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Support', href: '/admin/support' }, { label: 'Tickets' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600">Manage and respond to customer support requests</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600">
          <Plus className="w-4 h-4" />
          New Ticket
        </button>
      </div>

      <div className="flex gap-6">
        {/* Tickets List */}
        <div className={`${selectedTicket ? 'w-1/2' : 'w-full'} transition-all`}>
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 flex flex-col sm:flex-row gap-4 border-b border-gray-100">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 text-sm"
                >
                  <option value="all">All Priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div className="divide-y divide-gray-50">
              {filteredTickets.map((ticket) => {
                const priorityConf = priorityConfig[ticket.priority];
                const statusConf = statusConfig[ticket.status];
                const ChannelIcon = channelConfig[ticket.channel].icon;
                const isSelected = selectedTicket?.id === ticket.id;

                return (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-4 cursor-pointer transition-colors ${isSelected ? 'bg-gold-50 border-l-4 border-gold-500' : 'hover:bg-gray-50'}`}
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${priorityConf.bg}`}>
                        <ChannelIcon className={`w-5 h-5 ${priorityConf.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-gray-500">{ticket.id}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${priorityConf.bg} ${priorityConf.color}`}>
                            {ticket.priority}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${statusConf.bg} ${statusConf.color}`}>
                            {statusConf.label}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900 text-sm truncate">{ticket.subject}</p>
                        <p className="text-xs text-gray-500">{ticket.customer.name} · {formatRelativeDate(ticket.createdAt)}</p>
                      </div>
                      {ticket.assignee && (
                        <div className="text-xs text-gray-400">{ticket.assignee.name}</div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="flex items-center justify-between p-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">{filteredTickets.length} tickets</p>
              <div className="flex items-center gap-2">
                <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="px-3 py-1 bg-gold-500 text-white rounded-lg text-sm">1</button>
                <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Ticket Detail Panel */}
        <AnimatePresence>
          {selectedTicket && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-1/2 bg-white rounded-xl shadow-sm flex flex-col max-h-[calc(100vh-200px)]"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-gray-500">{selectedTicket.id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityConfig[selectedTicket.priority].bg} ${priorityConfig[selectedTicket.priority].color}`}>
                        {selectedTicket.priority}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{selectedTicket.subject}</h3>
                  </div>
                  <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4">
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value as Ticket['status'])}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                  >
                    {Object.entries(statusConfig).map(([key, conf]) => (
                      <option key={key} value={key}>{conf.label}</option>
                    ))}
                  </select>
                  <select
                    value={selectedTicket.assignee?.id || ''}
                    onChange={(e) => handleAssign(selectedTicket.id, e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
                  >
                    <option value="">Assign to...</option>
                    {AGENTS.map((agent) => (
                      <option key={agent.id} value={agent.id}>{agent.name}</option>
                    ))}
                  </select>
                </div>

                {/* Customer Info */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{selectedTicket.customer.name}</p>
                      <p className="text-sm text-gray-500">{selectedTicket.customer.email}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-white rounded border border-gray-200">{selectedTicket.customer.country}</span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedTicket.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'customer' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        msg.sender === 'customer'
                          ? 'bg-gray-100 text-gray-900 rounded-bl-md'
                          : msg.sender === 'system'
                          ? 'bg-yellow-50 text-yellow-800 text-center w-full max-w-full rounded-lg text-sm'
                          : msg.isInternal
                          ? 'bg-purple-50 text-purple-800 rounded-br-md border border-purple-200'
                          : 'bg-gold-500 text-white rounded-br-md'
                      }`}
                    >
                      {msg.sender !== 'system' && (
                        <p className={`text-xs mb-1 ${msg.sender === 'customer' ? 'text-gray-500' : msg.isInternal ? 'text-purple-600' : 'text-gold-100'}`}>
                          {msg.senderName} {msg.isInternal && '(Internal Note)'}
                        </p>
                      )}
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.sender === 'customer' ? 'text-gray-400' : msg.sender === 'system' ? 'text-yellow-600' : msg.isInternal ? 'text-purple-400' : 'text-gold-200'}`}>
                        {formatRelativeDate(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              <div className="p-4 border-t border-gray-100 flex-shrink-0">
                <div className="flex gap-2">
                  <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <Paperclip className="w-5 h-5 text-gray-500" />
                  </button>
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || sending}
                    className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50 flex items-center gap-2"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
