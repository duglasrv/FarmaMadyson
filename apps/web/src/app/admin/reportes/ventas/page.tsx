'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, BarChart3 } from 'lucide-react';
import { apiClient as api } from '@/lib/api-client';
import { formatPrice } from '@/lib/utils';
import { exportToExcel } from '@/lib/export-excel';

interface SalesReport {
  summary: { totalOrders: number; totalRevenue: number; averageOrderValue: number };
  byProduct: { name: string; category: string; quantity: number; revenue: number }[];
  byCategory: { name: string; quantity: number; revenue: number }[];
  daily: { date: string; orders: number; revenue: number }[];
}

export default function SalesReportPage() {
  const today = new Date().toISOString().slice(0, 10);
  const thirtyAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(thirtyAgo);
  const [to, setTo] = useState(today);

  const { data, isLoading } = useQuery<SalesReport>({
    queryKey: ['report-sales', from, to],
    queryFn: () => api.get('/reports/sales', { params: { from, to } }).then((r) => r.data),
  });

  const handleExport = () => {
    if (!data) return;
    exportToExcel(
      data.byProduct.map((p) => ({
        Producto: p.name,
        Categoría: p.category,
        'Cantidad Vendida': p.quantity,
        'Ingresos (Q)': p.revenue.toFixed(2),
      })),
      `ventas_${from}_${to}`,
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Reporte de Ventas
          </h1>
          <p className="text-sm text-muted-foreground">Ventas por período, producto y categoría</p>
        </div>
        <button
          onClick={handleExport}
          disabled={!data}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar Excel
        </button>
      </div>

      {/* Date Filters */}
      <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">Desde</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">Hasta</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data ? (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Total Pedidos', value: data.summary.totalOrders.toString() },
              { label: 'Ingresos Totales', value: formatPrice(data.summary.totalRevenue) },
              { label: 'Ticket Promedio', value: formatPrice(data.summary.averageOrderValue) },
            ].map((kpi, i) => (
              <div key={i} className="bg-white rounded-xl border border-border p-5">
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* By Category */}
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold mb-4">Ventas por Categoría</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="px-3 py-2 font-medium text-xs uppercase">Categoría</th>
                    <th className="px-3 py-2 font-medium text-xs uppercase text-right">Unidades</th>
                    <th className="px-3 py-2 font-medium text-xs uppercase text-right">Ingresos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.byCategory.map((cat) => (
                    <tr key={cat.name} className="hover:bg-muted/20">
                      <td className="px-3 py-2 font-medium">{cat.name}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground">{cat.quantity}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatPrice(cat.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* By Product (top 20) */}
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold mb-4">Top Productos</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="px-3 py-2 font-medium text-xs uppercase">Producto</th>
                    <th className="px-3 py-2 font-medium text-xs uppercase">Categoría</th>
                    <th className="px-3 py-2 font-medium text-xs uppercase text-right">Unidades</th>
                    <th className="px-3 py-2 font-medium text-xs uppercase text-right">Ingresos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.byProduct.slice(0, 20).map((p, i) => (
                    <tr key={i} className="hover:bg-muted/20">
                      <td className="px-3 py-2 font-medium">{p.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{p.category}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground">{p.quantity}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatPrice(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
