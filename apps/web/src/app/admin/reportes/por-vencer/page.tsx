'use client';

import { useQuery } from '@tanstack/react-query';
import { Download, AlertTriangle } from 'lucide-react';
import { apiClient as api } from '@/lib/api-client';
import { formatPrice } from '@/lib/utils';
import { exportToExcel } from '@/lib/export-excel';

const URGENCY_LABELS: Record<string, string> = {
  '30_DAYS': '30 días',
  '60_DAYS': '60 días',
  '90_DAYS': '90 días',
};

const URGENCY_COLORS: Record<string, string> = {
  '30_DAYS': 'bg-red-50 text-red-700',
  '60_DAYS': 'bg-amber-50 text-amber-700',
  '90_DAYS': 'bg-yellow-50 text-yellow-700',
};

interface ExpiringReport {
  summary: { totalItems: number; totalValue: number; within30Days: number; within60Days: number; within90Days: number };
  items: {
    batchNumber: string;
    product: string;
    variant: string;
    sku: string;
    quantity: number;
    unitCost: number;
    totalValue: number;
    expirationDate: string;
    daysUntilExpiry: number;
    urgency: string;
  }[];
}

export default function ExpiringReportPage() {
  const { data, isLoading } = useQuery<ExpiringReport>({
    queryKey: ['report-expiring'],
    queryFn: () => api.get('/reports/expiring').then((r) => r.data),
  });

  const handleExport = () => {
    if (!data) return;
    exportToExcel(
      data.items.map((i) => ({
        Lote: i.batchNumber,
        Producto: i.product,
        Variante: i.variant,
        SKU: i.sku,
        Cantidad: i.quantity,
        'Costo Unit. (Q)': i.unitCost.toFixed(2),
        'Valor Total (Q)': i.totalValue.toFixed(2),
        'Fecha Vencimiento': new Date(i.expirationDate).toLocaleDateString('es-GT'),
        'Días Restantes': i.daysUntilExpiry,
      })),
      'productos_por_vencer',
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            Productos por Vencer
          </h1>
          <p className="text-sm text-muted-foreground">Productos próximos a vencer en 30/60/90 días</p>
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

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Valor en Riesgo', value: formatPrice(data.summary.totalValue), color: 'text-red-600' },
              { label: 'En 30 días', value: data.summary.within30Days.toString(), color: 'text-red-600' },
              { label: 'En 60 días', value: data.summary.within60Days.toString(), color: 'text-amber-600' },
              { label: 'En 90 días', value: data.summary.within90Days.toString(), color: 'text-yellow-600' },
            ].map((kpi, i) => (
              <div key={i} className="bg-white rounded-xl border border-border p-5">
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="text-sm font-semibold mb-4">
              Detalle por Lote ({data.summary.totalItems} items)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="px-3 py-2 font-medium text-xs uppercase">Lote</th>
                    <th className="px-3 py-2 font-medium text-xs uppercase">Producto</th>
                    <th className="px-3 py-2 font-medium text-xs uppercase text-right">Cantidad</th>
                    <th className="px-3 py-2 font-medium text-xs uppercase text-right">Valor</th>
                    <th className="px-3 py-2 font-medium text-xs uppercase">Vence</th>
                    <th className="px-3 py-2 font-medium text-xs uppercase">Urgencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.items.map((item, i) => (
                    <tr key={i} className="hover:bg-muted/20">
                      <td className="px-3 py-2 font-mono text-xs">{item.batchNumber}</td>
                      <td className="px-3 py-2">
                        <p className="font-medium">{item.product}</p>
                        <p className="text-xs text-muted-foreground">{item.variant}</p>
                      </td>
                      <td className="px-3 py-2 text-right">{item.quantity}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatPrice(item.totalValue)}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {new Date(item.expirationDate).toLocaleDateString('es-GT')}
                        <span className="ml-1 text-xs">({item.daysUntilExpiry}d)</span>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            URGENCY_COLORS[item.urgency] || ''
                          }`}
                        >
                          {URGENCY_LABELS[item.urgency] || item.urgency}
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
