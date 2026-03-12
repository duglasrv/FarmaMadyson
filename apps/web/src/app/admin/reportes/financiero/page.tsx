'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, DollarSign } from 'lucide-react';
import { apiClient as api } from '@/lib/api-client';
import { formatPrice } from '@/lib/utils';
import { exportToExcel } from '@/lib/export-excel';

interface FinancialReport {
  summary: { totalRevenue: number; totalCost: number; grossProfit: number; profitMargin: number };
  byProduct: { name: string; revenue: number; cost: number; profit: number; margin: number }[];
}

export default function FinancialReportPage() {
  const today = new Date().toISOString().slice(0, 10);
  const thirtyAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(thirtyAgo);
  const [to, setTo] = useState(today);

  const { data, isLoading } = useQuery<FinancialReport>({
    queryKey: ['report-financial', from, to],
    queryFn: () => api.get('/reports/financial', { params: { from, to } }).then((r) => r.data),
  });

  const handleExport = () => {
    if (!data) return;
    exportToExcel(
      data.byProduct.map((p) => ({
        Producto: p.name,
        'Ingresos (Q)': p.revenue.toFixed(2),
        'Costo (Q)': p.cost.toFixed(2),
        'Ganancia (Q)': p.profit.toFixed(2),
        'Margen (%)': p.margin.toFixed(1),
      })),
      `financiero_${from}_${to}`,
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary" />
            Reporte Financiero
          </h1>
          <p className="text-sm text-muted-foreground">Ingresos vs costos, margen por producto</p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Ingresos Totales', value: formatPrice(data.summary.totalRevenue) },
              { label: 'Costos Totales', value: formatPrice(data.summary.totalCost) },
              { label: 'Ganancia Bruta', value: formatPrice(data.summary.grossProfit), color: 'text-green-600' },
              { label: 'Margen', value: `${data.summary.profitMargin.toFixed(1)}%` },
            ].map((kpi, i) => (
              <div key={i} className="bg-white rounded-xl border border-border p-5">
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className={`text-2xl font-bold mt-1 ${kpi.color || 'text-foreground'}`}>
                  {kpi.value}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold mb-4">Margen por Producto</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="px-3 py-2 font-medium text-xs uppercase">Producto</th>
                    <th className="px-3 py-2 font-medium text-xs uppercase text-right">Ingresos</th>
                    <th className="px-3 py-2 font-medium text-xs uppercase text-right">Costo</th>
                    <th className="px-3 py-2 font-medium text-xs uppercase text-right">Ganancia</th>
                    <th className="px-3 py-2 font-medium text-xs uppercase text-right">Margen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.byProduct.map((p, i) => (
                    <tr key={i} className="hover:bg-muted/20">
                      <td className="px-3 py-2 font-medium">{p.name}</td>
                      <td className="px-3 py-2 text-right">{formatPrice(p.revenue)}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground">{formatPrice(p.cost)}</td>
                      <td className="px-3 py-2 text-right">
                        <span className={p.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatPrice(p.profit)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className={p.margin >= 20 ? 'text-green-600' : 'text-amber-600'}>
                          {p.margin.toFixed(1)}%
                        </span>
                      </td>
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
