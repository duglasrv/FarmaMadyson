'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Boxes,
  AlertTriangle,
  DollarSign,
  Search,
  Plus,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { apiClient as api } from '@/lib/api-client';

interface DashboardData {
  totalVariants: number;
  totalBatches: number;
  totalUnits: number;
  totalValue: number;
  activeAlerts: number;
  lowStockCount: number;
  expiringCount: number;
}

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  salePrice: number;
  purchasePrice: number;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  variants: ProductVariant[];
  category?: { name: string };
}

interface ProductsResponse {
  data: Product[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

// ── KPI Card ────────────────────────────────────────────────────────
function KPICard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ── Receive Modal ───────────────────────────────────────────────────
function ReceiveModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [variantSearch, setVariantSearch] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<{ id: string; name: string; product: string } | null>(null);
  const [form, setForm] = useState({
    quantity: 1,
    costPrice: 0,
    batchNumber: '',
    expirationDate: '',
    notes: '',
  });

  const { data: searchResults } = useQuery<{ data: Product[] }>({
    queryKey: ['product-search-inv', variantSearch],
    queryFn: () => api.get(`/products/search?q=${encodeURIComponent(variantSearch)}`).then((r) => r.data),
    enabled: variantSearch.length >= 2,
  });

  const products = searchResults?.data || [];

  const receiveMutation = useMutation({
    mutationFn: (data: any) => api.post('/inventory/receive', data),
    onSuccess: () => onSuccess(),
    onError: () => alert('Error al recibir inventario'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant || !form.expirationDate) return;
    receiveMutation.mutate({
      variantId: selectedVariant.id,
      quantity: form.quantity,
      costPrice: form.costPrice,
      batchNumber: form.batchNumber || undefined,
      expirationDate: form.expirationDate,
      notes: form.notes || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">Recibir inventario</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Variant selector */}
          {!selectedVariant ? (
            <div className="space-y-2">
              <label className="block text-sm font-medium">Buscar producto *</label>
              <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={variantSearch}
                  onChange={(e) => setVariantSearch(e.target.value)}
                  placeholder="Nombre o SKU..."
                  className="bg-transparent text-sm outline-none w-full"
                />
              </div>
              {products.length > 0 && (
                <div className="border border-border rounded-lg max-h-40 overflow-y-auto">
                  {products.map((p) =>
                    p.variants?.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setSelectedVariant({ id: v.id, name: v.name, product: p.name });
                          setForm((f) => ({ ...f, costPrice: Number(v.purchasePrice) || 0 }));
                          setVariantSearch('');
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-muted/30 text-sm"
                      >
                        <span className="font-medium">{p.name}</span>
                        <span className="text-muted-foreground"> — {v.name} ({v.sku})</span>
                      </button>
                    )),
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
              <div>
                <p className="text-sm font-medium">{selectedVariant.product}</p>
                <p className="text-xs text-muted-foreground">{selectedVariant.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVariant(null)}
                className="text-xs text-primary hover:underline"
              >
                Cambiar
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Cantidad *</label>
              <input
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Costo unitario *</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.costPrice}
                onChange={(e) => setForm((f) => ({ ...f, costPrice: Math.max(0, parseFloat(e.target.value) || 0) }))}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">No. de Lote</label>
            <input
              type="text"
              value={form.batchNumber}
              onChange={(e) => setForm((f) => ({ ...f, batchNumber: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm"
              placeholder="LOT-001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Fecha de vencimiento *</label>
            <input
              type="date"
              value={form.expirationDate}
              onChange={(e) => setForm((f) => ({ ...f, expirationDate: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-border rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notas</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!selectedVariant || !form.expirationDate || receiveMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {receiveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Recibir
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Adjust Modal ────────────────────────────────────────────────────
function AdjustModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [batchId, setBatchId] = useState('');
  const [form, setForm] = useState({
    quantity: 0,
    type: 'ADJUSTMENT' as 'ADJUSTMENT' | 'LOSS',
    reference: '',
    notes: '',
  });

  const adjustMutation = useMutation({
    mutationFn: (data: any) => api.post('/inventory/adjust', data),
    onSuccess: () => onSuccess(),
    onError: (err: any) => alert(err.response?.data?.message || 'Error al ajustar'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId || form.quantity === 0) return;
    adjustMutation.mutate({
      batchId,
      quantity: form.quantity,
      type: form.type,
      reference: form.reference || undefined,
      notes: form.notes || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Ajuste de inventario</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">ID del Lote *</label>
            <input
              type="text"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono"
              placeholder="UUID del lote"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tipo</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'ADJUSTMENT' | 'LOSS' }))}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm"
            >
              <option value="ADJUSTMENT">Ajuste</option>
              <option value="LOSS">Pérdida</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Cantidad * (+ agregar, − quitar)</label>
            <input
              type="number"
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: parseInt(e.target.value) || 0 }))}
              required
              className="w-full px-3 py-2 border border-border rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Referencia</label>
            <input
              type="text"
              value={form.reference}
              onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm"
              placeholder="Motivo o referencia"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notas</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!batchId || form.quantity === 0 || adjustMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {adjustMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Aplicar ajuste
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────
export default function AdminInventarioPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showReceive, setShowReceive] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const { data: dashboard } = useQuery<DashboardData>({
    queryKey: ['inventory-dashboard'],
    queryFn: () => api.get('/inventory/dashboard').then((r) => r.data),
  });

  const { data: productsData, isLoading } = useQuery<ProductsResponse>({
    queryKey: ['admin-products-stock', search, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('page', String(page));
      params.set('limit', '20');
      return api.get(`/products/admin/list?${params}`).then((r) => r.data);
    },
  });

  const products = productsData?.data || [];
  const meta = productsData?.meta || { total: 0, page: 1, limit: 20, totalPages: 1 };

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['inventory-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['admin-products-stock'] });
    setShowReceive(false);
    setShowAdjust(false);
    showToast('Operación completada');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Stock Actual</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAdjust(true)}
            className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Ajustar
          </button>
          <button
            onClick={() => setShowReceive(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Recibir mercadería
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard label="Unidades totales" value={dashboard.totalUnits.toLocaleString()} icon={Package} color="bg-blue-50 text-blue-600" />
          <KPICard label="Valor del inventario" value={`Q ${dashboard.totalValue.toLocaleString()}`} icon={DollarSign} color="bg-green-50 text-green-600" />
          <KPICard label="Alertas activas" value={dashboard.activeAlerts} icon={AlertTriangle} color="bg-amber-50 text-amber-600" />
          <KPICard label="Lotes registrados" value={dashboard.totalBatches} icon={Boxes} color="bg-purple-50 text-purple-600" />
        </div>
      )}

      {/* Products with stock */}
      <div className="bg-white rounded-xl border border-border">
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5 w-full max-w-sm">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar producto o SKU..."
              className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border bg-muted/30">
                <th className="px-4 py-3 font-medium text-xs uppercase">Producto</th>
                <th className="px-4 py-3 font-medium text-xs uppercase">SKU</th>
                <th className="px-4 py-3 font-medium text-xs uppercase">Categoría</th>
                <th className="px-4 py-3 font-medium text-xs uppercase text-right">Precio Venta</th>
                <th className="px-4 py-3 font-medium text-xs uppercase text-right">Costo</th>
                <th className="px-4 py-3 font-medium text-xs uppercase text-right">Stock</th>
                <th className="px-4 py-3 font-medium text-xs uppercase text-right">Umbral</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-muted-foreground">Cargando...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    No se encontraron productos
                  </td>
                </tr>
              ) : (
                products.flatMap((product) =>
                  product.variants.map((variant) => {
                    const isLow = variant.stock <= variant.lowStockThreshold && variant.stock > 0;
                    const isOut = variant.stock <= 0;
                    return (
                      <tr key={variant.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{variant.name}</p>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{variant.sku}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{product.category?.name || '—'}</td>
                        <td className="px-4 py-3 text-right">Q {Number(variant.salePrice).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">Q {Number(variant.purchasePrice).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              isOut
                                ? 'bg-red-50 text-red-700'
                                : isLow
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-green-50 text-green-700'
                            }`}
                          >
                            {variant.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-muted-foreground">{variant.lowStockThreshold}</td>
                      </tr>
                    );
                  }),
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              {meta.total} producto{meta.total !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(1)} disabled={page <= 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30">
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-xs font-medium">{meta.page} / {meta.totalPages}</span>
              <button onClick={() => setPage(page + 1)} disabled={page >= meta.totalPages} className="p-1.5 rounded hover:bg-muted disabled:opacity-30">
                <ChevronRight className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(meta.totalPages)} disabled={page >= meta.totalPages} className="p-1.5 rounded hover:bg-muted disabled:opacity-30">
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showReceive && <ReceiveModal onClose={() => setShowReceive(false)} onSuccess={handleModalSuccess} />}
      {showAdjust && <AdjustModal onClose={() => setShowAdjust(false)} onSuccess={handleModalSuccess} />}

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
