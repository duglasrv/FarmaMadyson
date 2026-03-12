'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Clock, Timer } from 'lucide-react';
import { apiClient as api } from '@/lib/api-client';

interface ExpiringBatch {
  batchId: string;
  batchNumber?: string;
  productName: string;
  variantName: string;
  sku: string;
  currentStock: number;
  expirationDate: string;
  daysUntilExpiry: number;
  supplier?: string;
}

const TABS = [
  { label: 'Crítico (≤7 días)', value: 7, color: 'text-red-600' },
  { label: 'Urgente (≤30 días)', value: 30, color: 'text-amber-600' },
  { label: 'Próximo (≤90 días)', value: 90, color: 'text-orange-500' },
];

export default function AdminPorVencerPage() {
  const [days, setDays] = useState(30);

  const { data: batches = [], isLoading } = useQuery<ExpiringBatch[]>({
    queryKey: ['inventory-expiring', days],
    queryFn: () => api.get(`/inventory/expiring?days=${days}`).then((r) => r.data),
  });

  const getUrgencyStyle = (daysLeft: number) => {
    if (daysLeft <= 7) return 'bg-red-50 text-red-700 border-red-200';
    if (daysLeft <= 30) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-orange-50 text-orange-600 border-orange-200';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Productos por Vencer</h1>
        <p className="text-sm text-muted-foreground">
          {batches.length} lote{batches.length !== 1 ? 's' : ''} próximo{batches.length !== 1 ? 's' : ''} a vencer
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/30 rounded-lg p-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setDays(tab.value)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              days === tab.value
                ? 'bg-white text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-20">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground">Cargando...</span>
        </div>
      ) : batches.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <Clock className="w-12 h-12 mx-auto mb-3 text-green-500" />
          <h2 className="text-lg font-semibold text-green-800">Sin productos por vencer</h2>
          <p className="text-sm text-green-700 mt-1">
            No hay lotes que venzan en los próximos {days} días
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border bg-muted/30">
                <th className="px-4 py-3 font-medium text-xs uppercase">Producto</th>
                <th className="px-4 py-3 font-medium text-xs uppercase">Lote</th>
                <th className="px-4 py-3 font-medium text-xs uppercase">Proveedor</th>
                <th className="px-4 py-3 font-medium text-xs uppercase text-right">Stock</th>
                <th className="px-4 py-3 font-medium text-xs uppercase">Vencimiento</th>
                <th className="px-4 py-3 font-medium text-xs uppercase text-right">Días</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {batches.map((batch) => (
                <tr key={batch.batchId} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{batch.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {batch.variantName} · {batch.sku}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {batch.batchNumber || '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {batch.supplier || '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{batch.currentStock}</td>
                  <td className="px-4 py-3 text-xs">
                    {new Date(batch.expirationDate).toLocaleDateString('es-GT')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${getUrgencyStyle(batch.daysUntilExpiry)}`}
                    >
                      <Timer className="w-3 h-3" />
                      {batch.daysUntilExpiry}d
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
