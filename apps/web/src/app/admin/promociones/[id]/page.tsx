'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Plus, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { apiClient as api } from '@/lib/api-client';
import { formatPrice } from '@/lib/utils';

const TYPE_LABELS: Record<string, string> = {
  PERCENTAGE: '% Descuento',
  FIXED_AMOUNT: 'Monto Fijo',
  BUY_X_GET_Y: 'Compra X Lleva Y',
  FREE_SHIPPING: 'Envío Gratis',
};

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  type: string;
  value: number;
  minPurchase: number | null;
  maxDiscount: number | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  displayLocations: string[];
  coupons: Coupon[];
}

interface Coupon {
  id: string;
  code: string;
  usageLimit: number | null;
  usageCount: number;
  perUserLimit: number;
  isActive: boolean;
  createdAt: string;
}

export default function PromotionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [perUserLimit, setPerUserLimit] = useState('1');

  const { data: promo, isLoading } = useQuery<Promotion>({
    queryKey: ['admin-promotion', id],
    queryFn: () => api.get(`/promotions/${id}`).then((r) => r.data),
  });

  const createCoupon = useMutation({
    mutationFn: () =>
      api.post('/coupons', {
        code: newCode,
        promotionId: id,
        usageLimit: usageLimit ? Number(usageLimit) : undefined,
        perUserLimit: Number(perUserLimit),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-promotion', id] });
      setNewCode('');
      setUsageLimit('');
      setPerUserLimit('1');
      setShowForm(false);
    },
  });

  const toggleCoupon = useMutation({
    mutationFn: (couponId: string) => api.patch(`/coupons/${couponId}/toggle`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-promotion', id] }),
  });

  const deleteCoupon = useMutation({
    mutationFn: (couponId: string) => api.delete(`/coupons/${couponId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-promotion', id] }),
  });

  if (isLoading || !promo) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const now = new Date();
  const isVigente = promo.isActive && now >= new Date(promo.startDate) && now <= new Date(promo.endDate);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/promociones" className="p-2 rounded-lg hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{promo.name}</h1>
          <p className="text-sm text-muted-foreground">{promo.description || 'Sin descripción'}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            isVigente ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {isVigente ? 'Vigente' : 'Inactiva'}
        </span>
      </div>

      {/* Promo Details */}
      <div className="bg-white rounded-xl border border-border p-5">
        <h2 className="text-sm font-semibold mb-4">Detalles de la Promoción</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Tipo</p>
            <p className="font-medium">{TYPE_LABELS[promo.type] || promo.type}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Valor</p>
            <p className="font-medium">
              {promo.type === 'PERCENTAGE'
                ? `${Number(promo.value)}%`
                : promo.type === 'FREE_SHIPPING'
                  ? 'Envío gratis'
                  : formatPrice(Number(promo.value))}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Mínimo de compra</p>
            <p className="font-medium">
              {promo.minPurchase ? formatPrice(Number(promo.minPurchase)) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Máximo descuento</p>
            <p className="font-medium">
              {promo.maxDiscount ? formatPrice(Number(promo.maxDiscount)) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Fecha inicio</p>
            <p className="font-medium">
              {new Date(promo.startDate).toLocaleDateString('es-GT', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Fecha fin</p>
            <p className="font-medium">
              {new Date(promo.endDate).toLocaleDateString('es-GT', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-muted-foreground">Display</p>
            <p className="font-medium">
              {promo.displayLocations.length > 0
                ? promo.displayLocations.join(', ')
                : 'Ninguno'}
            </p>
          </div>
        </div>
      </div>

      {/* Coupons */}
      <div className="bg-white rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">
            Cupones ({promo.coupons.length})
          </h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuevo Cupón
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createCoupon.mutate();
            }}
            className="bg-muted/30 rounded-lg p-4 mb-4 space-y-3"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Código *
                </label>
                <input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  required
                  placeholder="Ej: VERANO2025"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Límite de uso total
                </label>
                <input
                  type="number"
                  min="1"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  placeholder="Sin límite"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Límite por usuario
                </label>
                <input
                  type="number"
                  min="1"
                  value={perUserLimit}
                  onChange={(e) => setPerUserLimit(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createCoupon.isPending}
                className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {createCoupon.isPending ? 'Creando...' : 'Crear Cupón'}
              </button>
            </div>
            {createCoupon.isError && (
              <p className="text-xs text-red-600">Error al crear el cupón. Verifica que el código sea único.</p>
            )}
          </form>
        )}

        {promo.coupons.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No hay cupones. Crea uno para comenzar.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="px-3 py-2 font-medium text-xs uppercase">Código</th>
                  <th className="px-3 py-2 font-medium text-xs uppercase">Uso</th>
                  <th className="px-3 py-2 font-medium text-xs uppercase">Límite/Usuario</th>
                  <th className="px-3 py-2 font-medium text-xs uppercase">Estado</th>
                  <th className="px-3 py-2 font-medium text-xs uppercase w-24">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {promo.coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-muted/20">
                    <td className="px-3 py-2 font-mono text-sm font-medium">{coupon.code}</td>
                    <td className="px-3 py-2 text-sm text-muted-foreground">
                      {coupon.usageCount} / {coupon.usageLimit ?? '∞'}
                    </td>
                    <td className="px-3 py-2 text-sm text-muted-foreground">{coupon.perUserLimit}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          coupon.isActive
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {coupon.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleCoupon.mutate(coupon.id)}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary inline-flex"
                          title={coupon.isActive ? 'Desactivar' : 'Activar'}
                        >
                          {coupon.isActive ? (
                            <ToggleRight className="w-4 h-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('¿Eliminar este cupón?')) deleteCoupon.mutate(coupon.id);
                          }}
                          className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 inline-flex"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
