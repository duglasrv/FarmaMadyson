'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  X,
  Loader2,
  Image as ImageIcon,
  GripVertical,
} from 'lucide-react';
import { apiClient as api } from '@/lib/api-client';
import { ImageUpload } from '@/components/admin/ImageUpload';

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
  position: string;
  sortOrder: number;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
}

// ── Banner Form Modal ───────────────────────────────────────────────
function BannerModal({
  isOpen,
  banner,
  onClose,
  onSave,
  isSaving,
}: {
  isOpen: boolean;
  banner: Banner | null;
  onClose: () => void;
  onSave: (data: any) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState({
    title: banner?.title || '',
    subtitle: banner?.subtitle || '',
    imageUrl: banner?.imageUrl || '',
    linkUrl: banner?.linkUrl || '',
    position: banner?.position || 'hero',
    sortOrder: banner?.sortOrder ?? 0,
    startDate: banner?.startDate ? banner.startDate.split('T')[0] : '',
    endDate: banner?.endDate ? banner.endDate.split('T')[0] : '',
    isActive: banner?.isActive ?? true,
  });

  if (!isOpen) return null;

  const update = (field: string, value: string | number | boolean) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || undefined,
      imageUrl: form.imageUrl.trim(),
      linkUrl: form.linkUrl.trim() || undefined,
      position: form.position,
      sortOrder: Number(form.sortOrder),
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      isActive: form.isActive,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">
            {banner ? 'Editar banner' : 'Nuevo banner'}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Título *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              required
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Título del banner"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Subtítulo</label>
            <input
              type="text"
              value={form.subtitle}
              onChange={(e) => update('subtitle', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Subtítulo opcional"
            />
          </div>

          <div>
            <ImageUpload
              value={form.imageUrl}
              onChange={(url) => update('imageUrl', url)}
              folder="banners"
              label="Imagen del banner *"
              required
              placeholder="https://... o sube una imagen"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">URL de enlace</label>
            <input
              type="url"
              value={form.linkUrl}
              onChange={(e) => update('linkUrl', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="https://... (al hacer clic)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Posición</label>
              <select
                value={form.position}
                onChange={(e) => update('position', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-white"
              >
                <option value="hero">Hero (principal)</option>
                <option value="secondary">Secundario</option>
                <option value="sidebar">Lateral</option>
                <option value="footer">Pie de página</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Orden</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => update('sortOrder', parseInt(e.target.value) || 0)}
                min={0}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fecha inicio</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => update('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fecha fin</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => update('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => update('isActive', e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30"
            />
            <span className="text-sm">Activo</span>
          </label>

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
              disabled={!form.title.trim() || !form.imageUrl.trim() || isSaving}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {banner ? 'Guardar cambios' : 'Crear banner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────
export default function AdminBannersPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const { data: banners = [], isLoading } = useQuery<Banner[]>({
    queryKey: ['admin-banners'],
    queryFn: () => api.get('/banners').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/banners', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      setModalOpen(false);
      setEditingBanner(null);
      showToast('Banner creado exitosamente');
    },
    onError: () => showToast('Error al crear el banner', 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.patch(`/banners/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      setModalOpen(false);
      setEditingBanner(null);
      showToast('Banner actualizado');
    },
    onError: () => showToast('Error al actualizar', 'error'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/banners/${id}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      showToast('Estado actualizado');
    },
    onError: () => showToast('Error al cambiar estado', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/banners/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      showToast('Banner eliminado');
    },
    onError: () => showToast('Error al eliminar', 'error'),
  });

  const handleSave = (data: any) => {
    if (editingBanner) {
      updateMutation.mutate({ id: editingBanner.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const positionLabels: Record<string, string> = {
    hero: 'Hero',
    secondary: 'Secundario',
    sidebar: 'Lateral',
    footer: 'Pie de página',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Banners</h1>
          <p className="text-sm text-muted-foreground">
            {banners.length} banner{banners.length !== 1 ? 's' : ''} configurado{banners.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingBanner(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo banner
        </button>
      </div>

      {/* Banner Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">No hay banners configurados</p>
          <p className="text-sm text-muted-foreground mt-1">Crea tu primer banner para la tienda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {banners.map((banner) => {
            const pl = positionLabels[banner.position];
            const posLabel = pl ? pl : banner.position;
            return (
              <div
                key={banner.id}
                className={`bg-white rounded-xl border overflow-hidden transition-all ${
                  banner.isActive ? 'border-border' : 'border-border opacity-60'
                }`}
              >
                {/* Image */}
                <div className="relative h-40 bg-muted">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 flex gap-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/60 text-white">
                      {posLabel}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      banner.isActive ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                      {banner.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/60 text-white">
                    #{banner.sortOrder}
                  </span>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-sm truncate">{banner.title}</h3>
                  {banner.subtitle && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{banner.subtitle}</p>
                  )}

                  {(banner.startDate || banner.endDate) && (
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {banner.startDate
                        ? new Date(banner.startDate).toLocaleDateString('es-GT')
                        : '∞'}{' '}
                      →{' '}
                      {banner.endDate
                        ? new Date(banner.endDate).toLocaleDateString('es-GT')
                        : '∞'}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border">
                    <button
                      onClick={() => {
                        setEditingBanner(banner);
                        setModalOpen(true);
                      }}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleMutation.mutate(banner.id)}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary"
                      title={banner.isActive ? 'Desactivar' : 'Activar'}
                    >
                      {banner.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('¿Eliminar este banner?')) {
                          deleteMutation.mutate(banner.id);
                        }
                      }}
                      className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 ml-auto"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <BannerModal
        isOpen={modalOpen}
        banner={editingBanner}
        onClose={() => {
          setModalOpen(false);
          setEditingBanner(null);
        }}
        onSave={handleSave}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-destructive'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
