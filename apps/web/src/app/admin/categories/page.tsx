'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  FolderTree,
  Image,
  MoreHorizontal,
  Search,
  GripVertical,
  Eye,
  EyeOff,
  X,
  Loader2,
  Check,
  RefreshCw,
} from 'lucide-react';
import { AdminBreadcrumbs } from '@/components/admin/breadcrumbs';
import { useToast } from '@/components/admin/toast';
import { adminApi, CategoryData, ApiError } from '@/lib/api';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId: string | null;
  image?: string;
  productCount: number;
  isActive: boolean;
  order: number;
  children?: Category[];
}

const MOCK_CATEGORIES: Category[] = [
  {
    id: '1',
    name: 'Necklaces',
    slug: 'necklaces',
    description: 'Beautiful gold and diamond necklaces',
    parentId: null,
    productCount: 245,
    isActive: true,
    order: 1,
    children: [
      { id: '1a', name: 'Gold Necklaces', slug: 'gold-necklaces', description: '22K and 24K gold necklaces', parentId: '1', productCount: 120, isActive: true, order: 1 },
      { id: '1b', name: 'Diamond Necklaces', slug: 'diamond-necklaces', description: 'Diamond studded necklaces', parentId: '1', productCount: 85, isActive: true, order: 2 },
      { id: '1c', name: 'Pearl Necklaces', slug: 'pearl-necklaces', description: 'Elegant pearl necklaces', parentId: '1', productCount: 40, isActive: true, order: 3 },
    ],
  },
  {
    id: '2',
    name: 'Rings',
    slug: 'rings',
    description: 'Engagement, wedding, and fashion rings',
    parentId: null,
    productCount: 312,
    isActive: true,
    order: 2,
    children: [
      { id: '2a', name: 'Engagement Rings', slug: 'engagement-rings', description: 'Diamond engagement rings', parentId: '2', productCount: 150, isActive: true, order: 1 },
      { id: '2b', name: 'Wedding Bands', slug: 'wedding-bands', description: 'Wedding and anniversary bands', parentId: '2', productCount: 80, isActive: true, order: 2 },
      { id: '2c', name: 'Fashion Rings', slug: 'fashion-rings', description: 'Trendy fashion rings', parentId: '2', productCount: 82, isActive: true, order: 3 },
    ],
  },
  {
    id: '3',
    name: 'Earrings',
    slug: 'earrings',
    description: 'Studs, drops, and hoops',
    parentId: null,
    productCount: 198,
    isActive: true,
    order: 3,
    children: [
      { id: '3a', name: 'Studs', slug: 'studs', description: 'Classic stud earrings', parentId: '3', productCount: 75, isActive: true, order: 1 },
      { id: '3b', name: 'Drops', slug: 'drops', description: 'Elegant drop earrings', parentId: '3', productCount: 68, isActive: true, order: 2 },
      { id: '3c', name: 'Hoops', slug: 'hoops', description: 'Trendy hoop earrings', parentId: '3', productCount: 55, isActive: false, order: 3 },
    ],
  },
  {
    id: '4',
    name: 'Bangles',
    slug: 'bangles',
    description: 'Traditional and modern bangles',
    parentId: null,
    productCount: 156,
    isActive: true,
    order: 4,
  },
  {
    id: '5',
    name: 'Bracelets',
    slug: 'bracelets',
    description: 'Chain and charm bracelets',
    parentId: null,
    productCount: 89,
    isActive: true,
    order: 5,
  },
  {
    id: '6',
    name: 'Pendants',
    slug: 'pendants',
    description: 'Gold and diamond pendants',
    parentId: null,
    productCount: 134,
    isActive: false,
    order: 6,
  },
];

// Transform API data to local Category format
function mapCategoryData(data: CategoryData): Category {
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description || '',
    parentId: data.parentId,
    image: data.image || undefined,
    productCount: data.productCount,
    isActive: data.isActive,
    order: data.order,
    children: data.children?.map(mapCategoryData),
  };
}

export default function CategoriesPage() {
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editModal, setEditModal] = useState<Category | null>(null);
  const [createModal, setCreateModal] = useState<{ parentId: string | null } | null>(null);
  const [saving, setSaving] = useState(false);

  // Load categories from API
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.getCategories();
      const data = res?.data || [];
      setCategories(data.map(mapCategoryData));
      // Auto-expand top-level categories
      setExpandedIds(new Set(data.filter((c) => !c.parentId).slice(0, 3).map((c) => c.id)));
    } catch (err) {
      console.error('Failed to load categories:', err);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleActive = async (id: string) => {
    const findCat = (cats: Category[]): Category | undefined => {
      for (const c of cats) {
        if (c.id === id) return c;
        if (c.children) {
          const found = findCat(c.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    const cat = findCat(categories);
    if (!cat) return;

    try {
      await adminApi.updateCategory(id, { isActive: !cat.isActive });
      toast.success('Category visibility updated');
      loadCategories();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update category');
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Delete "${cat.name}"? This cannot be undone.`)) return;
    
    try {
      await adminApi.deleteCategory(cat.id);
      toast.success('Category deleted');
      loadCategories();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to delete category');
    }
  };

  const handleSave = async (data: { name: string; slug: string; description: string; isActive: boolean }, parentId: string | null, editId?: string) => {
    setSaving(true);
    try {
      if (editId) {
        await adminApi.updateCategory(editId, data);
        toast.success('Category updated');
      } else {
        await adminApi.createCategory({ ...data, parentId });
        toast.success('Category created');
      }
      loadCategories();
      setEditModal(null);
      setCreateModal(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const filteredCategories = searchQuery
    ? categories.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.children?.some((child) => child.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : categories;

  const countAll = (cats: Category[]): number => 
    cats.reduce((sum, c) => sum + 1 + (c.children ? countAll(c.children) : 0), 0);
  const countActive = (cats: Category[]): number =>
    cats.reduce((sum, c) => sum + (c.isActive ? 1 : 0) + (c.children ? countActive(c.children) : 0), 0);
  const countProducts = (cats: Category[]): number =>
    cats.reduce((sum, c) => sum + c.productCount + (c.children ? countProducts(c.children) : 0), 0);

  const totalCategories = countAll(categories);
  const activeCount = countActive(categories);
  const totalProducts = countProducts(categories);
  const subcategoryCount = categories.reduce((sum, c) => sum + (c.children?.length || 0), 0);

  return (
    <div>
      <AdminBreadcrumbs items={[{ label: 'Categories' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600">Organize your product catalog</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadCategories}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setCreateModal({ parentId: null })}
            className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Categories</p>
          <p className="text-2xl font-bold text-gray-900">{loading ? '...' : totalCategories}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Active Categories</p>
          <p className="text-2xl font-bold text-green-600">{loading ? '...' : activeCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Subcategories</p>
          <p className="text-2xl font-bold text-gray-900">{loading ? '...' : subcategoryCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Products</p>
          <p className="text-2xl font-bold text-gold-600">{loading ? '...' : totalProducts}</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
        </div>

        {/* Category Tree */}
        <div className="border-t border-gray-100">
          {filteredCategories.map((cat) => (
            <CategoryRow
              key={cat.id}
              category={cat}
              level={0}
              expanded={expandedIds.has(cat.id)}
              expandedIds={expandedIds}
              onToggleExpand={toggleExpand}
              onToggleActive={toggleActive}
              onEdit={setEditModal}
              onDelete={handleDelete}
              onAddChild={(parentId) => setCreateModal({ parentId })}
            />
          ))}
        </div>
      </div>

      {/* Edit / Create Modal */}
      <AnimatePresence>
        {(editModal || createModal) && (
          <CategoryModal
            category={editModal}
            parentId={createModal?.parentId ?? null}
            onClose={() => { setEditModal(null); setCreateModal(null); }}
            onSave={handleSave}
            saving={saving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CategoryRow({
  category,
  level,
  expanded,
  expandedIds,
  onToggleExpand,
  onToggleActive,
  onEdit,
  onDelete,
  onAddChild,
}: {
  category: Category;
  level: number;
  expanded: boolean;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onToggleActive: (id: string) => void;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
  onAddChild: (parentId: string) => void;
}) {
  const hasChildren = category.children && category.children.length > 0;
  const paddingLeft = 24 + level * 32;

  return (
    <>
      <div
        className={`flex items-center gap-3 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
          !category.isActive ? 'opacity-60' : ''
        }`}
        style={{ paddingLeft: `${paddingLeft}px`, paddingRight: '24px' }}
      >
        <button
          onClick={() => onToggleExpand(category.id)}
          className={`p-1 hover:bg-gray-200 rounded ${!hasChildren ? 'invisible' : ''}`}
        >
          <ChevronRight
            className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? 'rotate-90' : ''}`}
          />
        </button>

        <div className="w-10 h-10 bg-gold-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <FolderTree className="w-5 h-5 text-gold-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900">{category.name}</p>
            {!category.isActive && (
              <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded">Hidden</span>
            )}
          </div>
          <p className="text-sm text-gray-500 truncate">{category.description}</p>
        </div>

        <div className="text-sm text-gray-500 w-24 text-right">
          {category.productCount} products
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleActive(category.id)}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title={category.isActive ? 'Hide' : 'Show'}
          >
            {category.isActive ? (
              <Eye className="w-4 h-4 text-gray-500" />
            ) : (
              <EyeOff className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <button
            onClick={() => onAddChild(category.id)}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Add Subcategory"
          >
            <Plus className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={() => onEdit(category)}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Edit"
          >
            <Edit2 className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={() => onDelete(category)}
            className="p-2 hover:bg-red-50 rounded-lg"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>

      {/* Children */}
      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {category.children!.map((child) => (
              <CategoryRow
                key={child.id}
                category={child}
                level={level + 1}
                expanded={expandedIds.has(child.id)}
                expandedIds={expandedIds}
                onToggleExpand={onToggleExpand}
                onToggleActive={onToggleActive}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddChild={onAddChild}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function CategoryModal({
  category,
  parentId,
  onClose,
  onSave,
  saving,
}: {
  category: Category | null;
  parentId: string | null;
  onClose: () => void;
  onSave: (data: { name: string; slug: string; description: string; isActive: boolean }, parentId: string | null, editId?: string) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    isActive: category?.isActive ?? true,
  });

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: prev.slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    }));
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
        className="bg-white rounded-xl shadow-xl w-full max-w-md"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {category ? 'Edit Category' : 'Create Category'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave(form, parentId, category?.id);
          }}
          className="p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              required
              value={form.slug}
              onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              className="rounded text-gold-500 focus:ring-gold-500"
            />
            <span className="text-sm text-gray-700">Active (visible on storefront)</span>
          </label>
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
