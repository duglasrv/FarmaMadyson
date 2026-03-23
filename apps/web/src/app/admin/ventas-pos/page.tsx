'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Eye, Printer, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatPrice } from '@/lib/utils';

interface PosSale {
  id: string;
  saleNumber: string;
  total: number;
  subtotal: number;
  discount: number;
  paymentMethod: string;
  clientNit: string;
  clientName: string;
  cashReceived: number | null;
  change: number | null;
  createdAt: string;
  seller: { firstName: string; lastName: string };
  _count: { items: number };
}

interface SaleDetail {
  id: string;
  saleNumber: string;
  clientNit: string;
  clientName: string;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  cashReceived: number | null;
  change: number | null;
  notes: string | null;
  createdAt: string;
  items: { name: string; quantity: number; price: number; subtotal: number }[];
  seller: { firstName: string; lastName: string };
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
};

const PAYMENT_COLORS: Record<string, string> = {
  CASH: 'bg-green-50 text-green-700',
  CARD: 'bg-blue-50 text-blue-700',
  TRANSFER: 'bg-purple-50 text-purple-700',
};

export default function VentasPosPage() {
  const [sales, setSales] = useState<PosSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  // Detail modal
  const [selectedSale, setSelectedSale] = useState<SaleDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Toast
  const [toastMsg, setToastMsg] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ message, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadSales = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);

      const { data } = await apiClient.get(`/pos/sales?${params}`);
      setSales(data.data);
      setTotalPages(data.meta.totalPages);
      setTotal(data.meta.total);
    } catch {
      showToast('Error al cargar ventas', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, dateFrom, dateTo]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  const viewDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const { data } = await apiClient.get(`/pos/sales/${id}`);
      setSelectedSale(data);
    } catch {
      showToast('Error al cargar detalle', 'error');
    } finally {
      setLoadingDetail(false);
    }
  };

  const printReceipt = (sale: SaleDetail) => {
    const receiptHtml = `
      <html>
      <head>
        <title>Recibo ${sale.saleNumber}</title>
        <style>
          @page { margin: 0; size: 80mm auto; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; padding: 4mm; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .line { border-top: 1px dashed #000; margin: 4px 0; }
          .row { display: flex; justify-content: space-between; }
          .item-name { font-size: 11px; }
          .item-detail { font-size: 10px; color: #333; display: flex; justify-content: space-between; }
          .total-row { font-size: 14px; font-weight: bold; }
          .footer { font-size: 10px; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="center bold" style="font-size:14px;">FARMA MADYSON</div>
        <div class="center" style="font-size:10px;">4 Av 2-70 Zona 2, Chimaltenango</div>
        <div class="center" style="font-size:10px;">Tel: farmamadyson@gmail.com</div>
        <div class="line"></div>
        <div class="row"><span>No:</span><span class="bold">${sale.saleNumber}</span></div>
        <div class="row"><span>Fecha:</span><span>${new Date(sale.createdAt).toLocaleString('es-GT')}</span></div>
        <div class="row"><span>NIT:</span><span>${sale.clientNit}</span></div>
        <div class="row"><span>Cliente:</span><span>${sale.clientName}</span></div>
        <div class="row"><span>Cajero:</span><span>${sale.seller.firstName} ${sale.seller.lastName}</span></div>
        <div class="line"></div>
        ${sale.items.map(item => `
          <div class="item-name">${item.name}</div>
          <div class="item-detail">
            <span>${item.quantity} x Q${Number(item.price).toFixed(2)}</span>
            <span>Q${Number(item.subtotal).toFixed(2)}</span>
          </div>`).join('')}
        <div class="line"></div>
        <div class="row"><span>Subtotal:</span><span>Q${Number(sale.subtotal).toFixed(2)}</span></div>
        ${Number(sale.discount) > 0 ? `<div class="row"><span>Descuento:</span><span>-Q${Number(sale.discount).toFixed(2)}</span></div>` : ''}
        <div class="row total-row"><span>TOTAL:</span><span>Q${Number(sale.total).toFixed(2)}</span></div>
        <div class="line"></div>
        <div class="row"><span>Forma de pago:</span><span>${PAYMENT_LABELS[sale.paymentMethod] || sale.paymentMethod}</span></div>
        ${sale.cashReceived ? `<div class="row"><span>Recibido:</span><span>Q${Number(sale.cashReceived).toFixed(2)}</span></div>` : ''}
        ${sale.change ? `<div class="row bold"><span>Cambio:</span><span>Q${Number(sale.change).toFixed(2)}</span></div>` : ''}
        <div class="line"></div>
        <div class="center footer">¡Gracias por su compra!</div>
        <div class="center footer">Farma Madyson — Donde Comienza el Bienestar</div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=350,height=600');
    if (printWindow) {
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ventas Locales (POS)</h1>
        <p className="text-sm text-muted-foreground">Historial de ventas realizadas en punto de venta</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Desde</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Hasta</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
          <div className="ml-auto text-sm text-muted-foreground">
            {total} venta{total !== 1 ? 's' : ''} encontrada{total !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground bg-muted/30 border-b border-border">
                <th className="px-4 py-3 font-medium">No. Venta</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">NIT</th>
                <th className="px-4 py-3 font-medium">Productos</th>
                <th className="px-4 py-3 font-medium">Pago</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium">Cajero</th>
                <th className="px-4 py-3 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    No hay ventas en este período
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-primary">{sale.saleNumber}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(sale.createdAt).toLocaleString('es-GT', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">{sale.clientName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{sale.clientNit}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{sale._count.items}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${PAYMENT_COLORS[sale.paymentMethod] || 'bg-gray-50 text-gray-700'}`}>
                        {PAYMENT_LABELS[sale.paymentMethod] || sale.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold">{formatPrice(Number(sale.total))}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {sale.seller.firstName} {sale.seller.lastName}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => viewDetail(sale.id)}
                          className="p-1.5 rounded hover:bg-muted transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedSale(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Detalle de Venta</h2>
              <button onClick={() => setSelectedSale(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">No. Venta:</span><span className="font-medium">{selectedSale.saleNumber}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Fecha:</span><span>{new Date(selectedSale.createdAt).toLocaleString('es-GT')}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Cliente:</span><span>{selectedSale.clientName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">NIT:</span><span>{selectedSale.clientNit}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Cajero:</span><span>{selectedSale.seller.firstName} {selectedSale.seller.lastName}</span></div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pago:</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PAYMENT_COLORS[selectedSale.paymentMethod] || ''}`}>
                  {PAYMENT_LABELS[selectedSale.paymentMethod] || selectedSale.paymentMethod}
                </span>
              </div>
            </div>

            <div className="border-t border-border pt-3 space-y-2">
              <h3 className="text-sm font-semibold">Productos</h3>
              {selectedSale.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.quantity}x {item.name}</span>
                  <span className="font-medium">{formatPrice(Number(item.subtotal))}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{formatPrice(Number(selectedSale.subtotal))}</span>
              </div>
              {Number(selectedSale.discount) > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Descuento:</span>
                  <span>-{formatPrice(Number(selectedSale.discount))}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold">
                <span>TOTAL:</span>
                <span>{formatPrice(Number(selectedSale.total))}</span>
              </div>
              {selectedSale.cashReceived && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Recibido:</span>
                    <span>{formatPrice(Number(selectedSale.cashReceived))}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-green-600">
                    <span>Cambio:</span>
                    <span>{formatPrice(Number(selectedSale.change))}</span>
                  </div>
                </>
              )}
              {selectedSale.notes && (
                <div className="pt-2 text-xs text-muted-foreground">
                  <span className="font-medium">Notas:</span> {selectedSale.notes}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => printReceipt(selectedSale)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-lg hover:bg-muted transition-colors text-sm font-medium"
              >
                <Printer className="w-4 h-4" />
                Reimprimir
              </button>
              <button
                onClick={() => setSelectedSale(null)}
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {loadingDetail && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground mt-3">Cargando detalle...</p>
          </div>
        </div>
      )}

      {toastMsg && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-white text-sm z-50 ${
          toastMsg.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toastMsg.message}
        </div>
      )}
    </div>
  );
}
