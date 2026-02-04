'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  Loader2,
  Search,
  Phone,
  Mail,
  Star,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';
import { useToast } from '@/components/admin/toast';

interface SupportAgent {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'agent' | 'supervisor' | 'manager';
  status: 'online' | 'offline' | 'away' | 'busy';
  department: string;
  skills: string[];
  ticketsAssigned: number;
  ticketsResolved: number;
  avgResponseTime: string;
  rating: number;
  createdAt: string;
}

const MOCK_AGENTS: SupportAgent[] = [
  {
    id: '1',
    name: 'Priya Sharma',
    email: 'priya@grandgold.com',
    phone: '+91 98765 43210',
    role: 'supervisor',
    status: 'online',
    department: 'Customer Support',
    skills: ['Returns', 'Orders', 'Payments'],
    ticketsAssigned: 24,
    ticketsResolved: 156,
    avgResponseTime: '15 min',
    rating: 4.8,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Rahul Kumar',
    email: 'rahul@grandgold.com',
    phone: '+91 98765 43211',
    role: 'agent',
    status: 'busy',
    department: 'Technical Support',
    skills: ['Website Issues', 'App Issues', 'Account'],
    ticketsAssigned: 18,
    ticketsResolved: 89,
    avgResponseTime: '22 min',
    rating: 4.5,
    createdAt: '2024-02-20',
  },
  {
    id: '3',
    name: 'Aisha Khan',
    email: 'aisha@grandgold.com',
    role: 'agent',
    status: 'online',
    department: 'Customer Support',
    skills: ['Returns', 'Refunds', 'Complaints'],
    ticketsAssigned: 12,
    ticketsResolved: 67,
    avgResponseTime: '18 min',
    rating: 4.6,
    createdAt: '2024-03-10',
  },
  {
    id: '4',
    name: 'Mohammed Ali',
    email: 'ali@grandgold.com',
    role: 'manager',
    status: 'away',
    department: 'Quality Assurance',
    skills: ['Escalations', 'Training', 'Quality'],
    ticketsAssigned: 5,
    ticketsResolved: 234,
    avgResponseTime: '12 min',
    rating: 4.9,
    createdAt: '2023-11-05',
  },
];

const roleLabels: Record<string, string> = {
  agent: 'Agent',
  supervisor: 'Supervisor',
  manager: 'Manager',
};

const statusConfig: Record<string, { color: string; label: string }> = {
  online: { color: 'bg-green-500', label: 'Online' },
  offline: { color: 'bg-gray-400', label: 'Offline' },
  away: { color: 'bg-yellow-500', label: 'Away' },
  busy: { color: 'bg-red-500', label: 'Busy' },
};

export default function SupportAgentsPage() {
  const toast = useToast();
  const [agents, setAgents] = useState<SupportAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editingAgent, setEditingAgent] = useState<SupportAgent | null>(null);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setAgents(MOCK_AGENTS);
      setLoading(false);
    }, 500);
  }, []);

  const filteredAgents = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.department.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to remove this agent?')) return;
    setAgents((prev) => prev.filter((a) => a.id !== id));
    toast.success('Agent removed');
  };

  const handleSave = (agent: Partial<SupportAgent>) => {
    if (editingAgent) {
      setAgents((prev) =>
        prev.map((a) => (a.id === editingAgent.id ? { ...a, ...agent } : a))
      );
      toast.success('Agent updated');
    } else {
      const newAgent: SupportAgent = {
        id: `agent-${Date.now()}`,
        name: agent.name || '',
        email: agent.email || '',
        phone: agent.phone,
        role: agent.role || 'agent',
        status: 'offline',
        department: agent.department || 'Customer Support',
        skills: agent.skills || [],
        ticketsAssigned: 0,
        ticketsResolved: 0,
        avgResponseTime: '--',
        rating: 0,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setAgents((prev) => [...prev, newAgent]);
      toast.success('Agent added');
    }
    setModal(null);
    setEditingAgent(null);
  };

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Support', href: '/admin/support' }, { label: 'Agents' }]} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Agents</h1>
          <p className="text-gray-600">Manage your customer support team</p>
        </div>
        <button
          onClick={() => { setModal('add'); setEditingAgent(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600"
        >
          <Plus className="w-4 h-4" />
          Add Agent
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-600">Total Agents</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{agents.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-sm text-gray-600">Online</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{agents.filter((a) => a.status === 'online').length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-600">Active Tickets</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{agents.reduce((sum, a) => sum + a.ticketsAssigned, 0)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-gray-600">Avg Rating</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {agents.length ? (agents.reduce((sum, a) => sum + a.rating, 0) / agents.length).toFixed(1) : '--'}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search agents by name, email, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
        </div>
      </div>

      {/* Agents List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Agent</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Department</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Tickets</th>
                <th className="px-6 py-4 font-medium">Avg Response</th>
                <th className="px-6 py-4 font-medium">Rating</th>
                <th className="px-6 py-4 w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAgents.map((agent) => (
                <tr key={agent.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gold-100 rounded-full flex items-center justify-center text-gold-600 font-semibold">
                          {agent.name.charAt(0)}
                        </div>
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${statusConfig[agent.status].color}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{agent.name}</p>
                        <p className="text-sm text-gray-500">{agent.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      agent.role === 'manager' ? 'bg-purple-100 text-purple-700' :
                      agent.role === 'supervisor' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {roleLabels[agent.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{agent.department}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${statusConfig[agent.status].color}`} />
                      {statusConfig[agent.status].label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <span className="text-gray-900">{agent.ticketsAssigned}</span>
                      <span className="text-gray-400"> / </span>
                      <span className="text-green-600">{agent.ticketsResolved}</span>
                    </div>
                    <p className="text-xs text-gray-500">assigned / resolved</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      {agent.avgResponseTime}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-medium">{agent.rating.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditingAgent(agent); setModal('edit'); }}
                        className="p-2 hover:bg-gray-200 rounded"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(agent.id)}
                        className="p-2 hover:bg-red-50 rounded"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredAgents.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {search ? 'No agents match your search.' : 'No agents yet. Add one to get started.'}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {modal && (
          <AgentModal
            agent={editingAgent}
            onClose={() => { setModal(null); setEditingAgent(null); }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AgentModal({
  agent,
  onClose,
  onSave,
}: {
  agent: SupportAgent | null;
  onClose: () => void;
  onSave: (data: Partial<SupportAgent>) => void;
}) {
  const [name, setName] = useState(agent?.name ?? '');
  const [email, setEmail] = useState(agent?.email ?? '');
  const [phone, setPhone] = useState(agent?.phone ?? '');
  const [role, setRole] = useState<SupportAgent['role']>(agent?.role ?? 'agent');
  const [department, setDepartment] = useState(agent?.department ?? 'Customer Support');
  const [skills, setSkills] = useState(agent?.skills?.join(', ') ?? '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      onSave({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        role,
        department,
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setSaving(false);
    }, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{agent ? 'Edit Agent' : 'Add Agent'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agent@grandgold.com"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as SupportAgent['role'])}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              >
                <option value="agent">Agent</option>
                <option value="supervisor">Supervisor</option>
                <option value="manager">Manager</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500"
              >
                <option value="Customer Support">Customer Support</option>
                <option value="Technical Support">Technical Support</option>
                <option value="Sales Support">Sales Support</option>
                <option value="Quality Assurance">Quality Assurance</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
            <input
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. Returns, Refunds, Orders"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-500"
            />
            <p className="text-xs text-gray-500 mt-1">Comma-separated list of skills</p>
          </div>
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
