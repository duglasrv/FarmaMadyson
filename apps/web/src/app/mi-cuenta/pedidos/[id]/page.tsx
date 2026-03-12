'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, CheckCircle, Clock, FileText } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatPrice } from '@/lib/utils';

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  PROCESSING: 'Preparando',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get(`/orders/my/${orderId}`)
      .then(({ data }) => setOrder(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-6 bg-muted/50 rounded w-1/3" /><div className="h-40 bg-muted/50 rounded" /></div>;
  }

  if (!order) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Pedido no encontrado.</p>
        <Link href="/mi-cuenta/pedidos" className="text-primary hover:underline text-sm mt-2 inline-block">
          Volver a mis pedidos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/mi-cuenta/pedidos" className="p-1 hover:bg-muted rounded-md">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-lg font-semibold">{order.orderNumber}</h2>
          <p className="text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString('es-GT', {
              year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      {/* Status timeline */}
      {order.statusHistory && (
        <div className="bg-white rounded-xl border border-border p-4">
          <h3 className="font-medium text-sm mb-3">Historial de Estado</h3>
          <div className="space-y-3">
            {order.statusHistory.map((entry: any, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-0.5">
                  {i === order.statusHistory.length - 1 ? (
                    <CheckCircle className="w-4 h-4 text-primary" />
                  ) : (
                    <Clock className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {statusLabels[entry.status] || entry.status}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleDateString('es-GT')}
                    {entry.note && ` — ${entry.note}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-xl border border-border divide-y divide-border">
        <h3 className="font-medium text-sm px-4 py-3">Productos</h3>
        {order.items?.map((item: any) => (
          <div key={item.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium">{item.productName}</p>
              <p className="text-xs text-muted-foreground">
                {item.variantPresentation} · {item.quantity} × {formatPrice(item.unitPrice)}
              </p>
            </div>
            <span className="text-sm font-medium">{formatPrice(item.subtotal)}</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="bg-white rounded-xl border border-border p-4 space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
        {order.taxAmount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">IVA</span><span>{formatPrice(order.taxAmount)}</span></div>}
        <div className="flex justify-between"><span className="text-muted-foreground">Envío</span><span>{order.shippingCost === 0 ? 'Gratis' : formatPrice(order.shippingCost)}</span></div>
        {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Descuento</span><span>-{formatPrice(order.discount)}</span></div>}
        <div className="flex justify-between text-lg font-bold pt-2 border-t border-border"><span>Total</span><span className="text-primary">{formatPrice(order.total)}</span></div>
      </div>

      {/* Shipping address */}
      {order.address && (
        <div className="bg-white rounded-xl border border-border p-4">
          <h3 className="font-medium text-sm mb-2">Dirección de Envío</h3>
          <div className="text-sm text-muted-foreground space-y-0.5">
            <p className="text-foreground font-medium">{order.address.fullName}</p>
            <p>{order.address.addressLine1}</p>
            <p>{order.address.city}, {order.address.department}</p>
            <p>{order.address.phone}</p>
          </div>
        </div>
      )}

      {/* Payment info */}
      {order.payment && (
        <div className="bg-white rounded-xl border border-border p-4">
          <h3 className="font-medium text-sm mb-2">Pago</h3>
          <p className="text-sm">
            {order.payment.method === 'BANK_TRANSFER' ? '🏦 Transferencia bancaria' : '💵 Contra entrega'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Estado: {order.payment.status}
          </p>
          {order.payment.method === 'BANK_TRANSFER' && order.payment.status === 'AWAITING_PROOF' && (
            <button className="mt-3 flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg text-sm font-medium">
              <Upload className="w-4 h-4" /> Subir Comprobante
            </button>
          )}
        </div>
      )}

      {/* Prescription */}
      {order.prescriptions && order.prescriptions.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-4">
          <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Recetas
          </h3>
          {order.prescriptions.map((p: any) => (
            <div key={p.id} className="text-sm text-muted-foreground">
              Estado: {p.status} · Subida: {new Date(p.createdAt).toLocaleDateString('es-GT')}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
