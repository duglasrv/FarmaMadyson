'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Search,
  Package,
} from 'lucide-react';
import Link from 'next/link';
import { apiClient as api } from '@/lib/api-client';

interface Supplier {
  id: string;
  name: string;
}

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  purchasePrice: number;
}

interface ProductResult {
  id: string;
  name: string;
  variants: ProductVariant[];
}

interface OrderItem {
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitCost: number;
}

export default function NuevaOrdenPage() {
  const router = useRouter();
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load suppliers
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ['suppliers-list'],
    queryFn: () => api.get('/suppliers').then((r) => r.data),
  });

  // Search products (debounced by React Query's staleTime)
  const { data: searchResults } = useQuery<{ data: ProductResult[] }>({
    queryKey: ['product-search', productSearch],
    queryFn: () => api.get(`/products/search?q=${encodeURIComponent(productSearch)}`).then((r) => r.data),
    enabled: productSearch.length >= 2,
  });

  const products = searchResults?.data || [];

  const addItem = useCallback(
    (product: ProductResult, variant: ProductVariant) => {
      // Don't add duplicates
      if (items.some((i) => i.variantId === variant.id)) {
        showToast('Esta variante ya está en la lista', 'error');
        return;
      }
      setItems((prev) => [
        ...prev,
        {
          variantId: variant.id,
          productName: product.name,
          variantName: variant.name,
          sku: variant.sku,
          quantity: 1,
          unitCost: Number(variant.purchasePrice) || 0,
        },
      ]);
      setProductSearch('');
      setShowResults(false);
    },
    [items],
  );

  const updateItem = (index: number, field: 'quantity' | 'unitCost', value: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

  const createMutation = useMutation({
    mutationFn: (data: { supplierId: string; notes?: string; items: { variantId: string; quantity: number; unitCost: number }[] }) =>
      api.post('/purchase-orders', data),
    onSuccess: () => {
      showToast('Orden de compra creada exitosamente');
      setTimeout(() => router.push('/admin/compras'), 500);
    },
    onError: () => showToast('Error al crear la orden', 'error'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || items.length === 0) return;
    createMutation.mutate({
      supplierId,
      notes: notes.trim() || undefined,
      items: items.map((i) => ({
        variantId: i.variantId,
        quantity: i.quantity,
        unitCost: i.unitCost,
      })),
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/compras"
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nueva Orden de Compra</h1>
          <p className="text-sm text-muted-foreground">Se creará en estado Borrador</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Supplier + Notes */}
        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Proveedor *</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Seleccionar proveedor...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              placeholder="Notas internas (opcional)"
            />
          </div>
        </div>

        {/* Product Search + Items */}
        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          <h2 className="font-semibold">Productos</h2>

          {/* Search */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => productSearch.length >= 2 && setShowResults(true)}
                placeholder="Buscar producto por nombre o SKU..."
                className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
              />
            </div>

            {/* Search results dropdown */}
            {showResults && products.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {products.map((product) =>
                  product.variants?.map((variant) => (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => addItem(product, variant)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 text-left transition-colors"
                    >
                      <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {variant.name} · SKU: {variant.sku} · Q {Number(variant.purchasePrice || 0).toFixed(2)}
                        </p>
                      </div>
                      <Plus className="w-4 h-4 text-primary flex-shrink-0" />
                    </button>
                  )),
                )}
              </div>
            )}
          </div>

          {/* Items table */}
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Busca y agrega productos a la orden</p>
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="pb-2 font-medium text-xs uppercase">Producto</th>
                    <th className="pb-2 font-medium text-xs uppercase w-24">Cantidad</th>
                    <th className="pb-2 font-medium text-xs uppercase w-32">Costo Unit.</th>
                    <th className="pb-2 font-medium text-xs uppercase w-28 text-right">Subtotal</th>
                    <th className="pb-2 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item, idx) => (
                    <tr key={item.variantId}>
                      <td className="py-2">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.variantName} · {item.sku}
                        </p>
                      </td>
                      <td className="py-2">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-20 px-2 py-1 border border-border rounded text-sm text-center"
                        />
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground text-xs">Q</span>
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={item.unitCost}
                            onChange={(e) => updateItem(idx, 'unitCost', Math.max(0, parseFloat(e.target.value) || 0))}
                            className="w-24 px-2 py-1 border border-border rounded text-sm"
                          />
                        </div>
                      </td>
                      <td className="py-2 text-right font-medium">
                        Q {(item.quantity * item.unitCost).toFixed(2)}
                      </td>
                      <td className="py-2">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total */}
              <div className="flex justify-end pt-2 border-t border-border">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-xl font-bold">Q {subtotal.toFixed(2)}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link
            href="/admin/compras"
            className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={!supplierId || items.length === 0 || createMutation.isPending}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Crear orden de compra
          </button>
        </div>
      </form>

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
