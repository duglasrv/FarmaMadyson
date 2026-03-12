'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Filter,
} from 'lucide-react';
import { apiClient as api } from '@/lib/api-client';

interface InventoryMovement {
  id: string;
  batchId: string;
  type: string;
  quantity: number;
  reference?: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  batch?: {
    batchNumber?: string;
    variant?: {
      name: string;
      sku: string;
      product?: { name: string };
    };
  };
}

interface MovementsResponse {
  data: InventoryMovement[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const TYPE_OPTIONS = [
  { label: 'Todos', value: '' },
  { label: 'Compra', value: 'PURCHASE' },
  { label: 'Venta', value: 'SALE' },
  { label: 'Ajuste', value: 'ADJUSTMENT' },
  { label: 'Pérdida', value: 'LOSS' },
];

const typeStyles: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  PURCHASE: { icon: ArrowUpCircle, color: 'text-green-600', label: 'Compra' },
  SALE: { icon: ArrowDownCircle, color: 'text-blue-600', label: 'Venta' },
  ADJUSTMENT: { icon: RefreshCw, color: 'text-amber-600', label: 'Ajuste' },
  LOSS: { icon: ArrowDownCircle, color: 'text-red-600', label: 'Pérdida' },
};

export default function AdminMovimientosPage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data, isLoading } = useQuery<MovementsResponse>({
    queryKey: ['inventory-movements', typeFilter, dateFrom, dateTo, page],
    queryFn: () => {
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      params.set('page', String(page));
      params.set('limit', '30');
      return api.get(`/inventory/movements?${params}`).then((r) => r.data);
    },
  });

  const movements = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, limit: 30, totalPages: 1 };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Movimientos de Inventario</h1>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 bg-white rounded-xl border border-border p-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Tipo</label>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 border border-border rounded-lg text-sm"
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Desde</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="px-3 py-1.5 border border-border rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Hasta</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="px-3 py-1.5 border border-border rounded-lg text-sm"
          />
        </div>
        {(typeFilter || dateFrom || dateTo) && (
          <button
            onClick={() => { setTypeFilter(''); setDateFrom(''); setDateTo(''); setPage(1); }}
            className="px-3 py-1.5 text-sm text-primary hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border bg-muted/30">
                <th className="px-4 py-3 font-medium text-xs uppercase">Tipo</th>
                <th className="px-4 py-3 font-medium text-xs uppercase">Producto</th>
                <th className="px-4 py-3 font-medium text-xs uppercase">Lote</th>
                <th className="px-4 py-3 font-medium text-xs uppercase text-right">Cantidad</th>
                <th className="px-4 py-3 font-medium text-xs uppercase">Referencia</th>
                <th className="px-4 py-3 font-medium text-xs uppercase">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-muted-foreground">Cargando...</span>
                    </div>
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    No hay movimientos registrados
                  </td>
                </tr>
              ) : (
                movements.map((mov) => {
                  const s = typeStyles[mov.type];
                  const style = s ? s : { icon: RefreshCw, color: 'text-gray-600', label: mov.type };
                  const Icon = style.icon;
                  return (
                    <tr key={mov.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${style.color}`} />
                          <span className="text-xs font-medium">{style.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {mov.batch?.variant ? (
                          <div>
                            <p className="font-medium text-xs">{mov.batch.variant.product?.name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {mov.batch.variant.name} · {mov.batch.variant.sku}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {mov.batch?.batchNumber || mov.batchId.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`font-medium ${
                            mov.quantity > 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {mov.quantity > 0 ? '+' : ''}
                          {mov.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{mov.reference || '—'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(mov.createdAt).toLocaleString('es-GT', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                    </tr>
                  );
                })
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
    </div>
  );
}
