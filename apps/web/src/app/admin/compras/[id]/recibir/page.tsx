'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  PackageCheck,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
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
  totalAmount: number;
  notes?: string;
  supplier: { id: string; name: string };
  items: PurchaseOrderItem[];
}

interface ReceiveItemForm {
  purchaseOrderItemId: string;
  quantityReceived: number;
  batchNumber: string;
  expirationDate: string;
  costPrice: number;
}

export default function RecibirOrdenPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [receiveNotes, setReceiveNotes] = useState('');
  const [receiveItems, setReceiveItems] = useState<ReceiveItemForm[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const { data: order, isLoading } = useQuery<PurchaseOrder>({
    queryKey: ['purchase-order', orderId],
    queryFn: async () => {
      // Fetch order details via the list endpoint with a specific search
      const res = await api.get(`/purchase-orders?page=1&limit=100`);
      const orders = res.data.data || res.data;
      const found = orders.find((o: PurchaseOrder) => o.id === orderId);
      if (!found) throw new Error('Orden no encontrada');
      return found;
    },
    enabled: !!orderId,
  });

  // Initialize receiveItems when order loads
  const initializeItems = (po: PurchaseOrder) => {
    if (receiveItems.length > 0) return;
    setReceiveItems(
      po.items
        .filter((item) => item.quantityReceived < item.quantity)
        .map((item) => ({
          purchaseOrderItemId: item.id,
          quantityReceived: item.quantity - item.quantityReceived,
          batchNumber: '',
          expirationDate: '',
          costPrice: Number(item.unitCost),
        })),
    );
  };

  if (order && receiveItems.length === 0 && order.items.some((i) => i.quantityReceived < i.quantity)) {
    initializeItems(order);
  }

  const updateReceiveItem = (index: number, field: keyof ReceiveItemForm, value: string | number) => {
    setReceiveItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const receiveMutation = useMutation({
    mutationFn: (data: { items: ReceiveItemForm[]; notes?: string }) =>
      api.post(`/purchase-orders/${orderId}/receive`, data),
    onSuccess: () => {
      showToast('Mercadería recibida exitosamente');
      setTimeout(() => router.push('/admin/compras'), 500);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Error al recibir mercadería';
      showToast(msg, 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = receiveItems.filter(
      (i) => i.quantityReceived > 0 && i.expirationDate,
    );
    if (validItems.length === 0) {
      showToast('Completa al menos un ítem con fecha de vencimiento', 'error');
      return;
    }
    receiveMutation.mutate({
      items: validItems,
      notes: receiveNotes.trim() || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-muted-foreground">Cargando orden...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p>Orden no encontrada</p>
        <Link href="/admin/compras" className="text-primary text-sm mt-2 inline-block">
          Volver a órdenes
        </Link>
      </div>
    );
  }

  const allReceived = order.items.every((i) => i.quantityReceived >= i.quantity);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/compras" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Recibir — {order.orderNumber}
          </h1>
          <p className="text-sm text-muted-foreground">
            Proveedor: {order.supplier?.name} · Total: Q {Number(order.totalAmount).toFixed(2)}
          </p>
        </div>
      </div>

      {allReceived ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <PackageCheck className="w-10 h-10 mx-auto mb-2 text-green-600" />
          <p className="font-medium text-green-800">Toda la mercadería ya fue recibida</p>
          <Link href="/admin/compras" className="text-green-700 text-sm underline mt-2 inline-block">
            Volver a órdenes
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Items to receive */}
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border bg-muted/30">
                    <th className="px-4 py-3 font-medium text-xs uppercase">Ítem</th>
                    <th className="px-4 py-3 font-medium text-xs uppercase w-20">Pedido</th>
                    <th className="px-4 py-3 font-medium text-xs uppercase w-20">Recibido</th>
                    <th className="px-4 py-3 font-medium text-xs uppercase w-24">Recibir</th>
                    <th className="px-4 py-3 font-medium text-xs uppercase w-32">No. Lote</th>
                    <th className="px-4 py-3 font-medium text-xs uppercase w-40">Vencimiento *</th>
                    <th className="px-4 py-3 font-medium text-xs uppercase w-28">Costo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {order.items.map((item, originalIdx) => {
                    const remaining = item.quantity - item.quantityReceived;
                    const formIdx = receiveItems.findIndex(
                      (ri) => ri.purchaseOrderItemId === item.id,
                    );
                    const isDone = remaining <= 0;

                    return (
                      <tr
                        key={item.id}
                        className={isDone ? 'bg-green-50/50 opacity-60' : 'hover:bg-muted/20'}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-xs">{item.variantId.slice(0, 8)}...</p>
                        </td>
                        <td className="px-4 py-3 text-center">{item.quantity}</td>
                        <td className="px-4 py-3 text-center">{item.quantityReceived}</td>
                        {isDone ? (
                          <td colSpan={4} className="px-4 py-3 text-center text-green-700 text-xs font-medium">
                            Completo
                          </td>
                        ) : formIdx >= 0 && receiveItems[formIdx] ? (
                          <>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min={0}
                                max={remaining}
                                value={receiveItems[formIdx].quantityReceived}
                                onChange={(e) =>
                                  updateReceiveItem(
                                    formIdx,
                                    'quantityReceived',
                                    Math.min(remaining, Math.max(0, parseInt(e.target.value) || 0)),
                                  )
                                }
                                className="w-20 px-2 py-1 border border-border rounded text-sm text-center"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={receiveItems[formIdx].batchNumber}
                                onChange={(e) =>
                                  updateReceiveItem(formIdx, 'batchNumber', e.target.value)
                                }
                                className="w-28 px-2 py-1 border border-border rounded text-sm"
                                placeholder="LOT-001"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="date"
                                value={receiveItems[formIdx].expirationDate}
                                onChange={(e) =>
                                  updateReceiveItem(formIdx, 'expirationDate', e.target.value)
                                }
                                required
                                className="w-36 px-2 py-1 border border-border rounded text-sm"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">Q</span>
                                <input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  value={receiveItems[formIdx].costPrice}
                                  onChange={(e) =>
                                    updateReceiveItem(
                                      formIdx,
                                      'costPrice',
                                      Math.max(0, parseFloat(e.target.value) || 0),
                                    )
                                  }
                                  className="w-22 px-2 py-1 border border-border rounded text-sm"
                                />
                              </div>
                            </td>
                          </>
                        ) : null}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-border p-6">
            <label className="block text-sm font-medium mb-1">Notas de recepción</label>
            <textarea
              value={receiveNotes}
              onChange={(e) => setReceiveNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              placeholder="Notas opcionales sobre la recepción..."
            />
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
              disabled={receiveMutation.isPending}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {receiveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <PackageCheck className="w-4 h-4" />
              Confirmar recepción
            </button>
          </div>
        </form>
      )}

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
