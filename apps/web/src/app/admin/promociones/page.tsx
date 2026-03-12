'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Eye, Trash2 } from 'lucide-react';
import { apiClient as api } from '@/lib/api-client';
import DataTable from '@/components/admin/DataTable';
import { formatPrice } from '@/lib/utils';

const TYPE_LABELS: Record<string, string> = {
  PERCENTAGE: '% Descuento',
  FIXED_AMOUNT: 'Monto Fijo',
  BUY_X_GET_Y: 'Compra X Lleva Y',
  FREE_SHIPPING: 'Envío Gratis',
};

interface Promotion {
  id: string;
  name: string;
  type: string;
  value: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
  _count: { coupons: number };
}

export default function AdminPromotionsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'' | 'true' | 'false'>('');
  const queryClient = useQueryClient();

  const { data: promos = [], isLoading } = useQuery({
    queryKey: ['admin-promotions', filter, search],
    queryFn: () =>
      api
        .get('/promotions', { params: { active: filter || undefined, search: search || undefined } })
        .then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/promotions/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-promotions'] }),
  });

  const now = new Date();

  const columns = [
    {
      header: 'Nombre',
      cell: (row: Promotion) => <span className="font-medium text-sm">{row.name}</span>,
    },
    {
      header: 'Tipo',
      cell: (row: Promotion) => (
        <span className="text-xs text-muted-foreground">{TYPE_LABELS[row.type] || row.type}</span>
      ),
    },
    {
      header: 'Valor',
      cell: (row: Promotion) => (
        <span className="text-sm font-medium">
          {row.type === 'PERCENTAGE'
            ? `${Number(row.value)}%`
            : row.type === 'FREE_SHIPPING'
              ? '—'
              : formatPrice(Number(row.value))}
        </span>
      ),
    },
    {
      header: 'Vigencia',
      cell: (row: Promotion) => {
        const start = new Date(row.startDate);
        const end = new Date(row.endDate);
        const active = row.isActive && now >= start && now <= end;
        return (
          <div>
            <span className="text-xs text-muted-foreground">
              {start.toLocaleDateString('es-GT')} — {end.toLocaleDateString('es-GT')}
            </span>
            <span
              className={`ml-2 inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}
            >
              {active ? 'Vigente' : 'Inactiva'}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Cupones',
      cell: (row: Promotion) => (
        <span className="text-sm text-muted-foreground">{row._count.coupons}</span>
      ),
    },
    {
      header: '',
      cell: (row: Promotion) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/admin/promociones/${row.id}`}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary inline-flex"
            title="Ver / Cupones"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <button
            onClick={() => {
              if (confirm('¿Eliminar esta promoción?')) deleteMutation.mutate(row.id);
            }}
            className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 inline-flex"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      className: 'w-20',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Promociones</h1>
          <p className="text-sm text-muted-foreground">Gestiona descuentos y cupones</p>
        </div>
        <Link
          href="/admin/promociones/nueva"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Promoción
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {(['', 'true', 'false'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === v
                ? 'bg-primary text-white'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {v === '' ? 'Todas' : v === 'true' ? 'Activas' : 'Inactivas'}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={promos}
        totalCount={promos.length}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar promoción..."
        isLoading={isLoading}
      />
    </div>
  );
}
