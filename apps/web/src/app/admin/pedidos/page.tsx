'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { apiClient as api } from '@/lib/api-client';
import { formatPrice } from '@/lib/utils';
import DataTable from '@/components/admin/DataTable';

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
  PENDING: 'bg-amber-50 text-amber-700',
  PENDING_PAYMENT: 'bg-orange-50 text-orange-700',
  PENDING_PRESCRIPTION: 'bg-purple-50 text-purple-700',
  CONFIRMED: 'bg-blue-50 text-blue-700',
  PREPARING: 'bg-indigo-50 text-indigo-700',
  SHIPPED: 'bg-teal-50 text-teal-700',
  DELIVERED: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-red-50 text-red-700',
  REFUNDED: 'bg-gray-50 text-gray-700',
};

const ALL_STATUSES = Object.keys(STATUS_LABELS);

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string };
}

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, search, statusFilter],
    queryFn: () =>
      api
        .get('/orders', {
          params: {
            page,
            limit: pageSize,
            status: statusFilter || undefined,
            search: search || undefined,
          },
        })
        .then((r) => r.data),
  });

  const orders: Order[] = data?.data || [];
  const totalCount = data?.meta?.total || 0;

  const columns = [
    {
      header: '# Orden',
      cell: (row: Order) => (
        <span className="font-medium text-primary text-sm">{row.orderNumber}</span>
      ),
    },
    {
      header: 'Cliente',
      cell: (row: Order) => (
        <div>
          <p className="text-sm font-medium">
            {row.user.firstName} {row.user.lastName}
          </p>
          <p className="text-xs text-muted-foreground">{row.user.email}</p>
        </div>
      ),
    },
    {
      header: 'Fecha',
      cell: (row: Order) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.createdAt).toLocaleDateString('es-GT', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      header: 'Total',
      cell: (row: Order) => (
        <span className="text-sm font-medium">{formatPrice(Number(row.totalAmount))}</span>
      ),
    },
    {
      header: 'Pago',
      cell: (row: Order) => (
        <span className="text-xs text-muted-foreground">
          {row.paymentMethod === 'BANK_TRANSFER' ? 'Transferencia' : 'Contra entrega'}
        </span>
      ),
    },
    {
      header: 'Estado',
      cell: (row: Order) => (
        <span
          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
            STATUS_COLORS[row.status] || 'bg-gray-50 text-gray-700'
          }`}
        >
          {STATUS_LABELS[row.status] || row.status}
        </span>
      ),
    },
    {
      header: '',
      cell: (row: Order) => (
        <Link
          href={`/admin/pedidos/${row.id}`}
          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary inline-flex"
          title="Ver detalle"
        >
          <Eye className="w-4 h-4" />
        </Link>
      ),
      className: 'w-12',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
        <p className="text-sm text-muted-foreground">Gestión de pedidos de la tienda</p>
      </div>

      {/* Status Filter Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => {
            setStatusFilter('');
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            !statusFilter ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          Todos
        </button>
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFilter(s);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-primary text-white'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={orders}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Buscar por #orden, cliente..."
        isLoading={isLoading}
      />
    </div>
  );
}
