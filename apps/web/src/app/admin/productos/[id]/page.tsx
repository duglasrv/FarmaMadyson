'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { apiClient as api } from '@/lib/api-client';
import { formatPrice } from '@/lib/utils';

interface VariantData {
  id: string;
  name: string;
  sku: string;
  supplierCode?: string;
  purchasePrice: number;
  suggestedPrice?: number;
  salePrice: number;
  compareAtPrice?: number;
  taxExempt: boolean;
  lowStockThreshold: number;
  isActive: boolean;
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'general' | 'variants' | 'pharma' | 'inventory'>('general');

  const { data: product, isLoading } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => api.get(`/products/${id}`).then((r) => r.data),
  });

  const [form, setForm] = useState<Record<string, string | boolean> | null>(null);
  const [pharma, setPharma] = useState<Record<string, string | boolean> | null>(null);

  // Init form when product loads
  if (product && !form) {
    setForm({
      name: product.name || '',
      description: product.description || '',
      categoryId: product.categoryId || '',
      brandId: product.brandId || '',
      productType: product.productType || 'MEDICINE',
      requiresPrescription: product.requiresPrescription || false,
      metaTitle: product.metaTitle || '',
      metaDescription: product.metaDescription || '',
    });
    if (product.pharmaInfo) {
      setPharma({
        activeIngredient: product.pharmaInfo.activeIngredient || '',
        concentration: product.pharmaInfo.concentration || '',
        dosageForm: product.pharmaInfo.dosageForm || '',
        administrationRoute: product.pharmaInfo.administrationRoute || '',
        therapeuticAction: product.pharmaInfo.therapeuticAction || '',
        contraindications: product.pharmaInfo.contraindications || '',
        sideEffects: product.pharmaInfo.sideEffects || '',
        storageConditions: product.pharmaInfo.storageConditions || '',
        isControlled: product.pharmaInfo.isControlled || false,
      });
    }
  }

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => api.get('/categories').then((r) => r.data),
  });

  const { data: brands } = useQuery({
    queryKey: ['admin-brands'],
    queryFn: () => api.get('/brands').then((r) => r.data),
  });

  const { data: variantStocks } = useQuery({
    queryKey: ['admin-product-stocks', id],
    queryFn: async () => {
      const variants: VariantData[] = product?.variants || [];
      const results: Record<string, unknown> = {};
      for (const v of variants) {
        try {
          const res = await api.get(`/inventory/variants/${v.id}/stock`);
          results[v.id] = res.data;
        } catch {
          results[v.id] = { totalStock: 0, batches: [] };
        }
      }
      return results;
    },
    enabled: !!product && tab === 'inventory',
  });

  const updateProduct = useMutation({
    mutationFn: () => api.patch(`/products/${id}`, form),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-product', id] }),
  });

  const updatePharma = useMutation({
    mutationFn: () => api.patch(`/products/${id}/pharma-info`, pharma),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-product', id] }),
  });

  const updateVariant = useMutation({
    mutationFn: (data: { vid: string; payload: Partial<VariantData> }) =>
      api.patch(`/products/${id}/variants/${data.vid}`, data.payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-product', id] }),
  });

  if (isLoading || !form) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs = [
    { key: 'general', label: 'General' },
    { key: 'variants', label: 'Variantes' },
    { key: 'pharma', label: 'Info Farmacéutica' },
    { key: 'inventory', label: 'Inventario' },
  ] as const;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/productos" className="p-2 rounded-lg hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
          <p className="text-sm text-muted-foreground">Editar producto</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {tab === 'general' && (
        <div className="bg-white rounded-xl border border-border p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Nombre</Label>
              <input
                value={form.name as string}
                onChange={(e) => setForm((p) => ({ ...p!, name: e.target.value }))}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Descripción</Label>
              <textarea
                value={form.description as string}
                onChange={(e) => setForm((p) => ({ ...p!, description: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>
            <div>
              <Label>Categoría</Label>
              <select
                value={form.categoryId as string}
                onChange={(e) => setForm((p) => ({ ...p!, categoryId: e.target.value }))}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              >
                <option value="">Seleccionar...</option>
                {(categories?.data || categories || []).map(
                  (cat: { id: string; name: string }) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div>
              <Label>Marca</Label>
              <select
                value={form.brandId as string}
                onChange={(e) => setForm((p) => ({ ...p!, brandId: e.target.value }))}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              >
                <option value="">Seleccionar...</option>
                {(brands?.data || brands || []).map(
                  (b: { id: string; name: string }) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div>
              <Label>Tipo</Label>
              <select
                value={form.productType as string}
                onChange={(e) => setForm((p) => ({ ...p!, productType: e.target.value }))}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              >
                <option value="MEDICINE">Medicamento</option>
                <option value="SUPPLEMENT">Suplemento</option>
                <option value="PERSONAL_CARE">Cuidado Personal</option>
                <option value="BABY_CARE">Bebé</option>
                <option value="MEDICAL_DEVICE">Dispositivo Médico</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.requiresPrescription as boolean}
                onChange={(e) =>
                  setForm((p) => ({ ...p!, requiresPrescription: e.target.checked }))
                }
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm">Requiere prescripción</span>
            </div>
            <button
              onClick={() => updateProduct.mutate()}
              disabled={updateProduct.isPending}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {updateProduct.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {/* Variants Tab */}
      {tab === 'variants' && (
        <div className="space-y-4">
          {product.variants?.map((v: VariantData) => (
            <div key={v.id} className="bg-white rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">{v.name}</h3>
                <span className="text-xs text-muted-foreground font-mono">{v.sku}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <Label>Precio Compra</Label>
                  <p className="font-medium">{formatPrice(Number(v.purchasePrice))}</p>
                </div>
                <div>
                  <Label>Precio Venta</Label>
                  <p className="font-medium">{formatPrice(Number(v.salePrice))}</p>
                </div>
                <div>
                  <Label>Precio Comparación</Label>
                  <p className="font-medium">
                    {v.compareAtPrice ? formatPrice(Number(v.compareAtPrice)) : '—'}
                  </p>
                </div>
                <div>
                  <Label>Umbral Stock Bajo</Label>
                  <p className="font-medium">{v.lowStockThreshold}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
                <button
                  onClick={() =>
                    updateVariant.mutate({
                      vid: v.id,
                      payload: { isActive: !v.isActive },
                    })
                  }
                  className={`text-xs px-3 py-1 rounded-full ${
                    v.isActive
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {v.isActive ? 'Activo' : 'Inactivo'}
                </button>
                <span className="text-xs text-muted-foreground">
                  {v.taxExempt ? 'Exento IVA' : 'Con IVA 12%'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pharma Tab */}
      {tab === 'pharma' && pharma && (
        <div className="bg-white rounded-xl border border-border p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {([
              ['activeIngredient', 'Principio Activo'],
              ['concentration', 'Concentración'],
              ['dosageForm', 'Forma Farmacéutica'],
              ['administrationRoute', 'Vía de Administración'],
              ['therapeuticAction', 'Acción Terapéutica'],
              ['storageConditions', 'Condiciones Almacenamiento'],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <Label>{label}</Label>
                <input
                  value={(pharma[key] as string) || ''}
                  onChange={(e) => setPharma((p) => ({ ...p!, [key]: e.target.value }))}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            ))}
            {(['contraindications', 'sideEffects'] as const).map((key) => (
              <div key={key}>
                <Label>{key === 'contraindications' ? 'Contraindicaciones' : 'Efectos Adversos'}</Label>
                <textarea
                  value={(pharma[key] as string) || ''}
                  onChange={(e) => setPharma((p) => ({ ...p!, [key]: e.target.value }))}
                  rows={2}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={pharma.isControlled as boolean}
                onChange={(e) => setPharma((p) => ({ ...p!, isControlled: e.target.checked }))}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm">Medicamento Controlado</span>
            </div>
            <button
              onClick={() => updatePharma.mutate()}
              disabled={updatePharma.isPending}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {updatePharma.isPending ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {/* Inventory Tab */}
      {tab === 'inventory' && (
        <div className="space-y-4">
          {product.variants?.map((v: VariantData) => {
            const stockData = variantStocks?.[v.id] as {
              totalStock?: number;
              batches?: {
                id: string;
                batchNumber: string;
                expirationDate: string;
                stock: number;
                costPrice: number;
              }[];
            };
            return (
              <div key={v.id} className="bg-white rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold">{v.name}</h3>
                    <span className="text-xs text-muted-foreground font-mono">{v.sku}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{stockData?.totalStock ?? '...'}</p>
                    <p className="text-xs text-muted-foreground">en stock</p>
                  </div>
                </div>
                {stockData?.batches && stockData.batches.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b border-border">
                        <th className="pb-2 text-xs font-medium">Lote</th>
                        <th className="pb-2 text-xs font-medium">Expiración</th>
                        <th className="pb-2 text-xs font-medium">Stock</th>
                        <th className="pb-2 text-xs font-medium">Costo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {stockData.batches.map(
                        (batch) => (
                          <tr key={batch.id}>
                            <td className="py-2 font-mono text-xs">{batch.batchNumber || '—'}</td>
                            <td className="py-2 text-xs">
                              {new Date(batch.expirationDate).toLocaleDateString('es-GT')}
                            </td>
                            <td className="py-2 font-medium">{batch.stock}</td>
                            <td className="py-2 text-xs">
                              {formatPrice(Number(batch.costPrice))}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-xs text-muted-foreground">Sin lotes registrados</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-muted-foreground mb-1">{children}</label>
  );
}
