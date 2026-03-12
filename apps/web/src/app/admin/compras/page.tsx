'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Plus,
  Send,
  PackageCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Truck,
} from 'lucide-react';
import { apiClient as api } from '@/lib/api-client';

interface PurchaseOrderItem {
  id: string;
  variantId: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  quantityReceived: number;
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  orderedAt?: string;
  receivedAt?: string;
  supplier: { id: string; name: string };
  items: PurchaseOrderItem[];
  _count?: { batches: number };
}

interface PaginatedResponse {
  data: PurchaseOrder[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const STATUS_TABS = [
  { label: 'Todos', value: '' },
  { label: 'Borrador', value: 'DRAFT' },
  { label: 'Enviada', value: 'SENT' },
  { label: 'Parcial', value: 'PARTIALLY_RECEIVED' },
  { label: 'Recibida', value: 'RECEIVED' },
  { label: 'Cancelada', value: 'CANCELLED' },
];

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-50 text-blue-700',
  PARTIALLY_RECEIVED: 'bg-amber-50 text-amber-700',
  RECEIVED: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-red-50 text-red-700',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviada',
  PARTIALLY_RECEIVED: 'Parcial',
  RECEIVED: 'Recibida',
  CANCELLED: 'Cancelada',
};

export default function AdminComprasPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const { data, isLoading } = useQuery<PaginatedResponse>({
    queryKey: ['admin-purchase-orders', statusFilter, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('limit', '20');
      return api.get(`/purchase-orders?${params}`).then((r) => r.data);
    },
  });

  const orders = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, limit: 20, totalPages: 1 };

  const sendMutation = useMutation({
    mutationFn: (id: string) => api.post(`/purchase-orders/${id}/send`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-purchase-orders'] });
      showToast('Orden marcada como enviada');
    },
    onError: () => showToast('Error al enviar la orden', 'error'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/purchase-orders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-purchase-orders'] });
      showToast('Orden cancelada');
    },
    onError: () => showToast('Solo se pueden cancelar órdenes en borrador', 'error'),
  });

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Órdenes de Compra</h1>
          <p className="text-sm text-muted-foreground">
            {meta.total} orden{meta.total !== 1 ? 'es' : ''} en total
          </p>
        </div>
        <Link
          href="/admin/compras/nueva"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva orden
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 bg-muted/30 rounded-lg p-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleStatusFilter(tab.value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-white text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border bg-muted/30">
                <th className="px-4 py-3 font-medium text-xs uppercase tracking-wide"># OC</th>
                <th className="px-4 py-3 font-medium text-xs uppercase tracking-wide">Proveedor</th>
                <th className="px-4 py-3 font-medium text-xs uppercase tracking-wide">Ítems</th>
                <th className="px-4 py-3 font-medium text-xs uppercase tracking-wide">Total</th>
                <th className="px-4 py-3 font-medium text-xs uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3 font-medium text-xs uppercase tracking-wide">Fecha</th>
                <th className="px-4 py-3 font-medium text-xs uppercase tracking-wide w-32">Acciones</th>
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
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    <Truck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>No hay órdenes de compra</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-medium">{order.orderNumber}</td>
                    <td className="px-4 py-3">{order.supplier?.name || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{order.items?.length || 0}</td>
                    <td className="px-4 py-3 font-medium">Q {Number(order.totalAmount).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          statusColors[order.status] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {statusLabels[order.status] || order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(order.createdAt).toLocaleDateString('es-GT')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {order.status === 'DRAFT' && (
                          <>
                            <button
                              onClick={() => sendMutation.mutate(order.id)}
                              disabled={sendMutation.isPending}
                              className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                              title="Marcar como enviada"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('¿Cancelar esta orden?')) {
                                  cancelMutation.mutate(order.id);
                                }
                              }}
                              disabled={cancelMutation.isPending}
                              className="p-1.5 rounded hover:bg-red-50 text-red-500"
                              title="Cancelar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {(order.status === 'SENT' || order.status === 'PARTIALLY_RECEIVED') && (
                          <Link
                            href={`/admin/compras/${order.id}/recibir`}
                            className="p-1.5 rounded hover:bg-green-50 text-green-600"
                            title="Recibir mercadería"
                          >
                            <PackageCheck className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Mostrando {(meta.page - 1) * meta.limit + 1}–
              {Math.min(meta.page * meta.limit, meta.total)} de {meta.total}
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
