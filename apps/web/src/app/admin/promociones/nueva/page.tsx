'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { apiClient as api } from '@/lib/api-client';

const TYPES = [
  { value: 'PERCENTAGE', label: '% Descuento' },
  { value: 'FIXED_AMOUNT', label: 'Monto Fijo (Q)' },
  { value: 'BUY_X_GET_Y', label: 'Compra X Lleva Y' },
  { value: 'FREE_SHIPPING', label: 'Envío Gratis' },
] as const;

const DISPLAY_OPTIONS = [
  { value: 'banner_hero', label: 'Banner Hero' },
  { value: 'product_card', label: 'Tarjeta Producto' },
  { value: 'checkout', label: 'Checkout' },
] as const;

export default function NewPromotionPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'PERCENTAGE',
    value: '',
    minPurchase: '',
    maxDiscount: '',
    startDate: '',
    endDate: '',
    isActive: true,
    displayLocations: [] as string[],
    applicableToAll: true,
  });

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/promotions', {
        ...form,
        value: Number(form.value),
        minPurchase: form.minPurchase ? Number(form.minPurchase) : undefined,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
      }),
    onSuccess: () => router.push('/admin/promociones'),
  });

  const set = (key: string, value: unknown) => setForm((p) => ({ ...p, [key]: value }));

  const toggleDisplay = (loc: string) =>
    setForm((p) => ({
      ...p,
      displayLocations: p.displayLocations.includes(loc)
        ? p.displayLocations.filter((l) => l !== loc)
        : [...p.displayLocations, loc],
    }));

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/promociones" className="p-2 rounded-lg hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nueva Promoción</h1>
          <p className="text-sm text-muted-foreground">Configura los parámetros del descuento</p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-6"
      >
        <div className="bg-white rounded-xl border border-border p-5 space-y-4">
          <h2 className="text-sm font-semibold">Información General</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Nombre *
              </label>
              <input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                required
                placeholder="Ej: Descuento de verano 20%"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Descripción
              </label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-5 space-y-4">
          <h2 className="text-sm font-semibold">Descuento</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Tipo *
              </label>
              <select
                value={form.type}
                onChange={(e) => set('type', e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Valor *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.value}
                onChange={(e) => set('value', e.target.value)}
                required
                placeholder={form.type === 'PERCENTAGE' ? 'Ej: 15' : 'Ej: 50.00'}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Mínimo de compra (Q)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.minPurchase}
                onChange={(e) => set('minPurchase', e.target.value)}
                placeholder="Opcional"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Máximo descuento (Q)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.maxDiscount}
                onChange={(e) => set('maxDiscount', e.target.value)}
                placeholder="Opcional"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-5 space-y-4">
          <h2 className="text-sm font-semibold">Vigencia y Visualización</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Fecha inicio *
              </label>
              <input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => set('startDate', e.target.value)}
                required
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Fecha fin *
              </label>
              <input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => set('endDate', e.target.value)}
                required
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-2">
                Ubicaciones de display
              </label>
              <div className="flex flex-wrap gap-3">
                {DISPLAY_OPTIONS.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.displayLocations.includes(opt.value)}
                      onChange={() => toggleDisplay(opt.value)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => set('isActive', e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                id="isActive"
              />
              <label htmlFor="isActive" className="text-sm cursor-pointer">
                Promoción activa
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/admin/promociones"
            className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {mutation.isPending ? 'Guardando...' : 'Crear Promoción'}
          </button>
        </div>
        {mutation.isError && (
          <p className="text-sm text-red-600">Error al crear la promoción. Verifica los datos.</p>
        )}
      </form>
    </div>
  );
}
