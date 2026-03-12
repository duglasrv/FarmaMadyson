'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { formatPrice } from '@/lib/utils';

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  CONFIRMED: 'bg-blue-50 text-blue-700',
  PROCESSING: 'bg-purple-50 text-purple-700',
  SHIPPED: 'bg-indigo-50 text-indigo-700',
  DELIVERED: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-red-50 text-red-700',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  PROCESSING: 'Preparando',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiClient
      .get('/orders/my', { params: { page, limit: 10 } })
      .then(({ data }) => {
        setOrders(data.orders || []);
        setTotal(data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / 10);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Mis Pedidos</h2>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-4 animate-pulse">
              <div className="h-4 bg-muted/50 rounded w-1/3 mb-2" />
              <div className="h-3 bg-muted/50 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-8 text-center text-muted-foreground">
          <p>No tienes pedidos aún.</p>
          <Link href="/productos" className="text-primary hover:underline text-sm mt-2 inline-block">
            Explorar productos
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/mi-cuenta/pedidos/${order.id}`}
              className="block bg-white rounded-xl border border-border p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{order.orderNumber}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(order.createdAt).toLocaleDateString('es-GT', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {order.items?.length || 0} producto(s) ·{' '}
                    {order.payment?.method === 'BANK_TRANSFER'
                      ? 'Transferencia'
                      : 'Contra entrega'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-primary">{formatPrice(order.total)}</p>
                  <span
                    className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                      statusColors[order.status] || 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border border-border rounded-lg disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="px-3 py-1.5 text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm border border-border rounded-lg disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
