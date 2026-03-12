'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  MapPin,
  CreditCard,
  FileCheck,
  Clock,
  CheckCircle,
  Package,
  Truck,
  XCircle,
} from 'lucide-react';
import { apiClient as api } from '@/lib/api-client';
import { formatPrice } from '@/lib/utils';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  PENDING_PAYMENT: 'Pago Pendiente',
  PENDING_PRESCRIPTION: 'Receta Pendiente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Preparando',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  PENDING_PAYMENT: 'bg-orange-50 text-orange-700 border-orange-200',
  PENDING_PRESCRIPTION: 'bg-purple-50 text-purple-700 border-purple-200',
  CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
  PREPARING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  SHIPPED: 'bg-teal-50 text-teal-700 border-teal-200',
  DELIVERED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
  REFUNDED: 'bg-gray-50 text-gray-700 border-gray-200',
};

const NEXT_STATUS_MAP: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  PENDING_PAYMENT: ['CONFIRMED', 'CANCELLED'],
  PENDING_PRESCRIPTION: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  CONFIRMED: <CheckCircle className="w-4 h-4" />,
  PREPARING: <Package className="w-4 h-4" />,
  SHIPPED: <Truck className="w-4 h-4" />,
  DELIVERED: <CheckCircle className="w-4 h-4" />,
  CANCELLED: <XCircle className="w-4 h-4" />,
};

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [statusNotes, setStatusNotes] = useState('');

  const { data: order, isLoading } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: () => api.get(`/orders/${id}`).then((r) => r.data),
  });

  const changeStatus = useMutation({
    mutationFn: (status: string) =>
      api.patch(`/orders/${id}/status`, { status, notes: statusNotes || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-order', id] });
      setStatusNotes('');
    },
  });

  const verifyPayment = useMutation({
    mutationFn: () => api.post(`/orders/${id}/verify-payment`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-order', id] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) return <p className="text-muted-foreground">Pedido no encontrado</p>;

  const nextStatuses = NEXT_STATUS_MAP[order.status] || [];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/pedidos" className="p-2 rounded-lg hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{order.orderNumber}</h1>
            <p className="text-sm text-muted-foreground">
              {new Date(order.createdAt).toLocaleString('es-GT')}
            </p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${
            STATUS_COLORS[order.status] || ''
          }`}
        >
          {STATUS_LABELS[order.status] || order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold mb-4">Productos</h3>
            <div className="divide-y divide-border">
              {order.items?.map(
                (item: {
                  id: string;
                  quantity: number;
                  unitPrice: number;
                  totalPrice: number;
                  taxAmount: number;
                  discountAmount: number;
                  variant: {
                    name: string;
                    sku: string;
                    product: { name: string };
                  };
                }) => (
                  <div key={item.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{item.variant?.product?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.variant?.name} · SKU: {item.variant?.sku}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">
                        {item.quantity} × {formatPrice(Number(item.unitPrice))}
                      </p>
                      <p className="font-medium">{formatPrice(Number(item.totalPrice))}</p>
                    </div>
                  </div>
                ),
              )}
            </div>
            <div className="border-t border-border pt-3 mt-3 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(Number(order.subtotal))}</span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento</span>
                  <span>-{formatPrice(Number(order.discountAmount))}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>IVA</span>
                <span>{formatPrice(Number(order.taxAmount))}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Envío</span>
                <span>
                  {Number(order.shippingCost) === 0
                    ? 'Gratis'
                    : formatPrice(Number(order.shippingCost))}
                </span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                <span>Total</span>
                <span>{formatPrice(Number(order.totalAmount))}</span>
              </div>
            </div>
          </div>

          {/* Status History */}
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Historial de Estados
            </h3>
            <div className="space-y-3">
              {order.statusHistory?.map(
                (entry: { id: string; status: string; notes: string; createdAt: string }) => (
                  <div key={entry.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">
                        {STATUS_LABELS[entry.status] || entry.status}
                      </p>
                      {entry.notes && (
                        <p className="text-xs text-muted-foreground">{entry.notes}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleString('es-GT')}
                      </p>
                    </div>
                  </div>
                ),
              )}
              {(!order.statusHistory || order.statusHistory.length === 0) && (
                <p className="text-xs text-muted-foreground">Sin historial</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Actions */}
          {nextStatuses.length > 0 && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold mb-3">Acciones</h3>
              <textarea
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                rows={2}
                placeholder="Notas (opcional)..."
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none mb-3"
              />
              <div className="space-y-2">
                {nextStatuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => changeStatus.mutate(s)}
                    disabled={changeStatus.isPending}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      s === 'CANCELLED'
                        ? 'bg-red-50 text-red-700 hover:bg-red-100'
                        : 'bg-primary text-white hover:bg-primary/90'
                    } disabled:opacity-50`}
                  >
                    {STATUS_ICONS[s]}
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Payment */}
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Pago
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Método</span>
                <span className="font-medium">
                  {order.paymentMethod === 'BANK_TRANSFER' ? 'Transferencia' : 'Contra entrega'}
                </span>
              </div>
              {order.payments?.map(
                (p: { id: string; status: string; amount: number; proofUrl?: string }) => (
                  <div key={p.id} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Estado</span>
                      <span
                        className={`font-medium ${
                          p.status === 'VERIFIED'
                            ? 'text-green-600'
                            : p.status === 'REJECTED'
                              ? 'text-red-600'
                              : 'text-amber-600'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monto</span>
                      <span>{formatPrice(Number(p.amount))}</span>
                    </div>
                  </div>
                ),
              )}
              {order.paymentMethod === 'BANK_TRANSFER' &&
                order.status === 'PENDING_PAYMENT' && (
                  <button
                    onClick={() => verifyPayment.mutate()}
                    disabled={verifyPayment.isPending}
                    className="w-full mt-2 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    <FileCheck className="w-4 h-4" />
                    Verificar Pago
                  </button>
                )}
            </div>
          </div>

          {/* Customer */}
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <User className="w-4 h-4" /> Cliente
            </h3>
            <div className="space-y-1 text-sm">
              <p className="font-medium">
                {order.user?.firstName} {order.user?.lastName}
              </p>
              <p className="text-muted-foreground">{order.user?.email}</p>
              <p className="text-muted-foreground">{order.user?.phone}</p>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Dirección de Envío
            </h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{order.shippingAddress?.fullName}</p>
              <p>{order.shippingAddress?.addressLine1}</p>
              {order.shippingAddress?.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
              <p>
                {order.shippingAddress?.city}, {order.shippingAddress?.department}
              </p>
              <p>{order.shippingAddress?.phone}</p>
            </div>
          </div>

          {/* Notes */}
          {(order.notes || order.customerNotes) && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold mb-3">Notas</h3>
              {order.customerNotes && (
                <div className="mb-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                    Del cliente
                  </p>
                  <p className="text-sm">{order.customerNotes}</p>
                </div>
              )}
              {order.notes && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                    Internas
                  </p>
                  <p className="text-sm">{order.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
