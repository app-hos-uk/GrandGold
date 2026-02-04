'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  Bot,
  Users,
  Store,
  X,
  Loader2,
  Check,
  ExternalLink,
  BarChart3,
} from 'lucide-react';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';
import { useToast } from '@/components/admin/toast';

interface KBArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  audience: 'customer' | 'seller' | 'both';
  status: 'published' | 'draft';
  views: number;
  helpful: number;
  notHelpful: number;
  aiEnabled: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface KBCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  articleCount: number;
  isActive: boolean;
}

const MOCK_CATEGORIES: KBCategory[] = [
  { id: 'cat-1', name: 'Orders & Shipping', slug: 'orders-shipping', description: 'Order tracking, delivery, shipping policies', icon: '📦', articleCount: 12, isActive: true },
  { id: 'cat-2', name: 'Returns & Refunds', slug: 'returns-refunds', description: 'Return policy, refund process, exchanges', icon: '🔄', articleCount: 8, isActive: true },
  { id: 'cat-3', name: 'Payments', slug: 'payments', description: 'Payment methods, EMI, invoices', icon: '💳', articleCount: 6, isActive: true },
  { id: 'cat-4', name: 'Account & KYC', slug: 'account-kyc', description: 'Account settings, verification, security', icon: '👤', articleCount: 5, isActive: true },
  { id: 'cat-5', name: 'Products & Quality', slug: 'products-quality', description: 'Gold purity, certifications, care', icon: '💎', articleCount: 10, isActive: true },
  { id: 'cat-6', name: 'Seller Help', slug: 'seller-help', description: 'Seller onboarding, dashboard, payouts', icon: '🏪', articleCount: 15, isActive: true },
];

const MOCK_ARTICLES: KBArticle[] = [
  { id: 'art-1', title: 'How to track my order?', slug: 'track-order', content: 'You can track your order from...', category: 'cat-1', audience: 'customer', status: 'published', views: 1250, helpful: 98, notHelpful: 5, aiEnabled: true, tags: ['tracking', 'order', 'delivery'], createdAt: '2024-01-15', updatedAt: '2024-02-01' },
  { id: 'art-2', title: 'What is the return policy?', slug: 'return-policy', content: 'Our 15-day return policy...', category: 'cat-2', audience: 'customer', status: 'published', views: 890, helpful: 78, notHelpful: 12, aiEnabled: true, tags: ['return', 'policy', 'refund'], createdAt: '2024-01-10', updatedAt: '2024-01-28' },
  { id: 'art-3', title: 'How to verify gold purity?', slug: 'verify-gold-purity', content: 'All our gold is BIS hallmarked...', category: 'cat-5', audience: 'customer', status: 'published', views: 2100, helpful: 195, notHelpful: 8, aiEnabled: true, tags: ['gold', 'purity', 'hallmark', 'certification'], createdAt: '2024-01-05', updatedAt: '2024-02-02' },
  { id: 'art-4', title: 'How to complete KYC verification?', slug: 'kyc-verification', content: 'KYC verification requires...', category: 'cat-4', audience: 'both', status: 'published', views: 650, helpful: 58, notHelpful: 15, aiEnabled: true, tags: ['kyc', 'verification', 'identity'], createdAt: '2024-01-20', updatedAt: '2024-01-25' },
  { id: 'art-5', title: 'Seller payout schedule', slug: 'seller-payout-schedule', content: 'Payouts are processed weekly...', category: 'cat-6', audience: 'seller', status: 'published', views: 420, helpful: 45, notHelpful: 3, aiEnabled: true, tags: ['payout', 'seller', 'payment'], createdAt: '2024-01-18', updatedAt: '2024-02-01' },
  { id: 'art-6', title: 'New EMI options guide', slug: 'emi-options', content: 'We now offer EMI...', category: 'cat-3', audience: 'customer', status: 'draft', views: 0, helpful: 0, notHelpful: 0, aiEnabled: false, tags: ['emi', 'payment', 'finance'], createdAt: '2024-02-03', updatedAt: '2024-02-03' },
];

const audienceConfig = {
  customer: { icon: Users, label: 'Customers', color: 'text-blue-600 bg-blue-100' },
  seller: { icon: Store, label: 'Sellers', color: 'text-purple-600 bg-purple-100' },
  both: { icon: Users, label: 'All', color: 'text-green-600 bg-green-100' },
};

export default function KnowledgeBasePage() {
  const toast = useToast();
  const [categories] = useState<KBCategory[]>(MOCK_CATEGORIES);
  const [articles, setArticles] = useState<KBArticle[]>(MOCK_ARTICLES);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editArticle, setEditArticle] = useState<KBArticle | null>(null);
  const [createMode, setCreateMode] = useState(false);

  const filteredArticles = articles.filter((a) => {
    if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const stats = {
    totalArticles: articles.length,
    published: articles.filter((a) => a.status === 'published').length,
    totalViews: articles.reduce((sum, a) => sum + a.views, 0),
    aiEnabled: articles.filter((a) => a.aiEnabled).length,
  };

  const handleToggleStatus = (articleId: string) => {
    setArticles((prev) =>
      prev.map((a) =>
        a.id === articleId
          ? { ...a, status: a.status === 'published' ? 'draft' : 'published' }
          : a
      )
    );
    toast.success('Article status updated');
  };

  const handleToggleAI = (articleId: string) => {
    setArticles((prev) =>
      prev.map((a) =>
        a.id === articleId ? { ...a, aiEnabled: !a.aiEnabled } : a
      )
    );
    toast.success('AI training status updated');
  };

  const handleDelete = (articleId: string) => {
    if (!confirm('Delete this article?')) return;
    setArticles((prev) => prev.filter((a) => a.id !== articleId));
    toast.success('Article deleted');
  };

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Support', href: '/admin/support' }, { label: 'Knowledge Base' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="text-gray-600">Manage help articles and FAQ content for AI training</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/IN/help"
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <ExternalLink className="w-4 h-4" />
            View Help Center
          </a>
          <button
            onClick={() => setCreateMode(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600"
          >
            <Plus className="w-4 h-4" />
            New Article
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalArticles}</p>
              <p className="text-sm text-gray-500">Total Articles</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.published}</p>
              <p className="text-sm text-gray-500">Published</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalViews.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Total Views</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold-100 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-gold-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.aiEnabled}</p>
              <p className="text-sm text-gray-500">AI Trained</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
            <div className="space-y-2">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                  categoryFilter === 'all' ? 'bg-gold-100 text-gold-700' : 'hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4" />
                  All Articles
                </span>
                <span className="text-sm text-gray-500">{articles.length}</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    categoryFilter === cat.id ? 'bg-gold-100 text-gold-700' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span className="text-sm">{cat.name}</span>
                  </span>
                  <span className="text-xs text-gray-500">{cat.articleCount}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Articles List */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 flex flex-col sm:flex-row gap-4 border-b border-gray-100">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div className="divide-y divide-gray-50">
              {filteredArticles.map((article) => {
                const category = categories.find((c) => c.id === article.category);
                const audienceConf = audienceConfig[article.audience];
                const AudienceIcon = audienceConf.icon;

                return (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{category?.icon}</span>
                          <h4 className="font-medium text-gray-900">{article.title}</h4>
                          {article.status === 'draft' && (
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">Draft</span>
                          )}
                          {article.aiEnabled && (
                            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded flex items-center gap-1">
                              <Bot className="w-3 h-3" />
                              AI
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded ${audienceConf.color}`}>
                            <AudienceIcon className="w-3 h-3" />
                            {audienceConf.label}
                          </span>
                          <span>{article.views.toLocaleString()} views</span>
                          <span className="text-green-600">👍 {article.helpful}</span>
                          <span className="text-red-600">👎 {article.notHelpful}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {article.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleAI(article.id)}
                          className={`p-2 rounded-lg ${article.aiEnabled ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100 text-gray-400'}`}
                          title={article.aiEnabled ? 'Disable AI training' : 'Enable AI training'}
                        >
                          <Bot className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(article.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                          title={article.status === 'published' ? 'Unpublish' : 'Publish'}
                        >
                          {article.status === 'published' ? (
                            <Eye className="w-4 h-4 text-green-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={() => setEditArticle(article)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(article.id)}
                          className="p-2 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Edit/Create Modal */}
      <AnimatePresence>
        {(editArticle || createMode) && (
          <ArticleModal
            article={editArticle}
            categories={categories}
            onClose={() => { setEditArticle(null); setCreateMode(false); }}
            onSave={(data) => {
              if (editArticle) {
                setArticles((prev) =>
                  prev.map((a) => (a.id === editArticle.id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a))
                );
                toast.success('Article updated');
              } else {
                const newArticle: KBArticle = {
                  id: `art-${Date.now()}`,
                  title: data.title || '',
                  slug: data.slug || '',
                  content: data.content || '',
                  category: data.category || '',
                  audience: data.audience || 'customer',
                  status: data.status || 'draft',
                  aiEnabled: data.aiEnabled ?? true,
                  tags: data.tags || [],
                  views: 0,
                  helpful: 0,
                  notHelpful: 0,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
                setArticles((prev) => [newArticle, ...prev]);
                toast.success('Article created');
              }
              setEditArticle(null);
              setCreateMode(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ArticleModal({
  article,
  categories,
  onClose,
  onSave,
}: {
  article: KBArticle | null;
  categories: KBCategory[];
  onClose: () => void;
  onSave: (data: Partial<KBArticle>) => void;
}) {
  const [form, setForm] = useState({
    title: article?.title || '',
    slug: article?.slug || '',
    content: article?.content || '',
    category: article?.category || categories[0]?.id || '',
    audience: article?.audience || 'customer',
    status: article?.status || 'draft',
    aiEnabled: article?.aiEnabled ?? true,
    tags: article?.tags.join(', ') || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    onSave({
      ...form,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      audience: form.audience as KBArticle['audience'],
      status: form.status as KBArticle['status'],
    });
    setSaving(false);
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
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {article ? 'Edit Article' : 'New Article'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
              <select
                value={form.audience}
                onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value as 'customer' | 'seller' | 'both' }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              >
                <option value="customer">Customers</option>
                <option value="seller">Sellers</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea
              required
              rows={8}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
            <input
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="order, delivery, tracking"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.status === 'published'}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.checked ? 'published' : 'draft' }))}
                className="rounded text-gold-500 focus:ring-gold-500"
              />
              <span className="text-sm text-gray-700">Published</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.aiEnabled}
                onChange={(e) => setForm((f) => ({ ...f, aiEnabled: e.target.checked }))}
                className="rounded text-purple-500 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700 flex items-center gap-1">
                <Bot className="w-4 h-4" />
                Enable for AI Training
              </span>
            </label>
          </div>
          <div className="flex gap-3 pt-4">
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
