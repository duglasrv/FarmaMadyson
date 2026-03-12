'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  FolderTree,
  GripVertical,
  ArrowUp,
  ArrowDown,
  X,
  Check,
  Loader2,
  Package,
} from 'lucide-react';
import { apiClient as api } from '@/lib/api-client';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  parentId?: string | null;
  sortOrder: number;
  isActive: boolean;
  children?: Category[];
  _count?: { products: number };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── Category Tree Node ──────────────────────────────────────────────
function CategoryNode({
  cat,
  level,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onMove,
  siblings,
  index,
}: {
  cat: Category;
  level: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
  onMove: (cat: Category, direction: 'up' | 'down') => void;
  siblings: Category[];
  index: number;
}) {
  const hasChildren = cat.children && cat.children.length > 0;
  const isOpen = expanded.has(cat.id);
  const productCount = cat._count?.products ?? 0;

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors group ${
          level > 0 ? 'ml-6 border-l-2 border-border pl-4' : ''
        }`}
      >
        {/* Expand/Collapse */}
        <button
          onClick={() => hasChildren && onToggle(cat.id)}
          className={`w-6 h-6 flex items-center justify-center rounded ${
            hasChildren
              ? 'text-muted-foreground hover:bg-muted cursor-pointer'
              : 'text-transparent cursor-default'
          }`}
        >
          {hasChildren &&
            (isOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            ))}
        </button>

        {/* Icon */}
        <span className="text-lg w-6 text-center flex-shrink-0">
          {cat.icon || (level === 0 ? '📁' : '📄')}
        </span>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <span className="font-medium text-sm text-foreground">{cat.name}</span>
          {productCount > 0 && (
            <span className="ml-2 text-xs text-muted-foreground">
              ({productCount} producto{productCount !== 1 ? 's' : ''})
            </span>
          )}
        </div>

        {/* Active badge */}
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
            cat.isActive
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {cat.isActive ? 'Activa' : 'Inactiva'}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onMove(cat, 'up')}
            disabled={index === 0}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30"
            title="Subir"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onMove(cat, 'down')}
            disabled={index === siblings.length - 1}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30"
            title="Bajar"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onEdit(cat)}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary"
            title="Editar"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(cat)}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
            title="Eliminar"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isOpen && (
        <div className="mt-0.5">
          {cat.children!.map((child, i) => (
            <CategoryNode
              key={child.id}
              cat={child}
              level={level + 1}
              expanded={expanded}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onMove={onMove}
              siblings={cat.children!}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Category Modal ──────────────────────────────────────────────────
function CategoryModal({
  isOpen,
  category,
  topLevelCategories,
  onClose,
  onSave,
  isSaving,
}: {
  isOpen: boolean;
  category: Category | null;
  topLevelCategories: Category[];
  onClose: () => void;
  onSave: (data: Partial<Category>) => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Reset form when modal opens/changes
  useState(() => {
    if (category) {
      setName(category.name);
      setSlug(category.slug);
      setDescription(category.description || '');
      setIcon(category.icon || '');
      setParentId(category.parentId || '');
      setIsActive(category.isActive);
      setSlugManuallyEdited(true);
    } else {
      setName('');
      setSlug('');
      setDescription('');
      setIcon('');
      setParentId('');
      setIsActive(true);
      setSlugManuallyEdited(false);
    }
  });

  if (!isOpen) return null;

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugManuallyEdited) {
      setSlug(slugify(value));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || undefined,
      icon: icon.trim() || undefined,
      parentId: parentId || null,
      isActive,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">
            {category ? 'Editar categoría' : 'Nueva categoría'}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Nombre *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Ej: Medicamentos"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugManuallyEdited(true);
              }}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
              placeholder="medicamentos"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              placeholder="Descripción de la categoría"
            />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Ícono (emoji)</label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="💊"
              maxLength={4}
            />
          </div>

          {/* Parent */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Categoría padre</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
            >
              <option value="">Ninguna (categoría principal)</option>
              {topLevelCategories
                .filter((c) => c.id !== category?.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon ? `${c.icon} ` : ''}{c.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Active */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30"
            />
            <span className="text-sm text-foreground">Activa</span>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSaving}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {category ? 'Guardar cambios' : 'Crear categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirmation ─────────────────────────────────────────────
function DeleteDialog({
  category,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  category: Category;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h3 className="text-lg font-semibold mb-2">¿Eliminar categoría?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Se eliminará <strong>{category.name}</strong>. Los productos asociados quedarán sin categoría.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-destructive text-white rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50"
          >
            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────
export default function AdminCategoriasPage() {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch categories tree
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['admin-categories'],
    queryFn: () => api.get('/categories').then((r) => r.data),
  });

  // Get top-level categories for parent selector
  const topLevelCategories = categories.filter((c) => !c.parentId);

  // Show toast
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<Category>) => api.post('/categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setModalOpen(false);
      setEditingCategory(null);
      showToast('Categoría creada exitosamente');
    },
    onError: () => showToast('Error al crear la categoría', 'error'),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) =>
      api.patch(`/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setModalOpen(false);
      setEditingCategory(null);
      showToast('Categoría actualizada exitosamente');
    },
    onError: () => showToast('Error al actualizar la categoría', 'error'),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setDeletingCategory(null);
      showToast('Categoría eliminada exitosamente');
    },
    onError: () => showToast('Error al eliminar la categoría', 'error'),
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: (items: { id: string; sortOrder: number; parentId?: string | null }[]) =>
      api.patch('/categories/reorder', { items }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    },
  });

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleEdit = (cat: Category) => {
    setEditingCategory(cat);
    setModalOpen(true);
  };

  const handleSave = (data: Partial<Category>) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleMove = (cat: Category, direction: 'up' | 'down') => {
    // Find siblings (same parentId)
    const parentChildren = cat.parentId
      ? findChildren(categories, cat.parentId)
      : categories.filter((c) => !c.parentId);

    const currentIndex = parentChildren.findIndex((c) => c.id === cat.id);
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (swapIndex < 0 || swapIndex >= parentChildren.length) return;

    const reordered = parentChildren.map((c, i) => ({
      id: c.id,
      sortOrder: i === currentIndex ? swapIndex : i === swapIndex ? currentIndex : i,
      parentId: c.parentId,
    }));

    reorderMutation.mutate(reordered);
  };

  // Expand all by default on first load
  if (categories.length > 0 && expanded.size === 0) {
    const allIds = new Set<string>();
    const collectIds = (cats: Category[]) => {
      for (const c of cats) {
        if (c.children && c.children.length > 0) {
          allIds.add(c.id);
          collectIds(c.children);
        }
      }
    };
    collectIds(categories);
    if (allIds.size > 0) setExpanded(allIds);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categorías</h1>
          <p className="text-sm text-muted-foreground">
            Organiza los productos en categorías jerárquicas
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCategory(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva categoría
        </button>
      </div>

      {/* Tree */}
      <div className="bg-white rounded-xl border border-border">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-muted-foreground text-sm">Cargando categorías...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FolderTree className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">No hay categorías</p>
            <p className="text-xs mt-1">Crea la primera categoría para organizar tus productos</p>
          </div>
        ) : (
          <div className="p-4 space-y-0.5">
            {categories
              .filter((c) => !c.parentId)
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((cat, i, arr) => (
                <CategoryNode
                  key={cat.id}
                  cat={cat}
                  level={0}
                  expanded={expanded}
                  onToggle={toggleExpand}
                  onEdit={handleEdit}
                  onDelete={setDeletingCategory}
                  onMove={handleMove}
                  siblings={arr}
                  index={i}
                />
              ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <CategoryModal
        isOpen={modalOpen}
        category={editingCategory}
        topLevelCategories={topLevelCategories}
        onClose={() => {
          setModalOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleSave}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Dialog */}
      {deletingCategory && (
        <DeleteDialog
          category={deletingCategory}
          onConfirm={() => deleteMutation.mutate(deletingCategory.id)}
          onCancel={() => setDeletingCategory(null)}
          isDeleting={deleteMutation.isPending}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white animate-in fade-in slide-in-from-bottom-2 ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-destructive'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

// Helper: find children of a given parentId in the tree
function findChildren(categories: Category[], parentId: string): Category[] {
  for (const cat of categories) {
    if (cat.id === parentId) return cat.children || [];
    if (cat.children) {
      const found = findChildren(cat.children, parentId);
      if (found.length > 0) return found;
    }
  }
  return [];
}
