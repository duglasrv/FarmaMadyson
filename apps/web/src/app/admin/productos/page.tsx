'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Edit, Eye, Ban, CheckCircle } from 'lucide-react';
import { apiClient as api } from '@/lib/api-client';
import { formatPrice } from '@/lib/utils';
import DataTable from '@/components/admin/DataTable';

interface Product {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  productType: string;
  category?: { name: string };
  brand?: { name: string };
  variants: {
    id: string;
    name: string;
    sku: string;
    salePrice: number;
    stock?: number;
  }[];
}

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page, search],
    queryFn: () =>
      api
        .get('/products/admin/list', {
          params: { page, limit: pageSize, search: search || undefined },
        })
        .then((r) => r.data),
  });

  const toggleActive = useMutation({
    mutationFn: (product: Product) =>
      api.patch(`/products/${product.id}`, { isActive: !product.isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  const products: Product[] = data?.data || [];
  const totalCount = data?.meta?.total || 0;

  const columns = [
    {
      header: 'Producto',
      cell: (row: Product) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-muted-foreground">
              {row.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{row.name}</p>
            <p className="text-xs text-muted-foreground">{row.productType}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'SKU',
      cell: (row: Product) => (
        <span className="text-xs font-mono text-muted-foreground">
          {row.variants?.[0]?.sku || '—'}
        </span>
      ),
    },
    {
      header: 'Categoría',
      cell: (row: Product) => (
        <span className="text-sm">{row.category?.name || '—'}</span>
      ),
    },
    {
      header: 'Precio',
      cell: (row: Product) => (
        <span className="text-sm font-medium">
          {row.variants?.[0] ? formatPrice(Number(row.variants[0].salePrice)) : '—'}
        </span>
      ),
    },
    {
      header: 'Stock',
      cell: (row: Product) => {
        const stock = row.variants?.[0]?.stock ?? 0;
        return (
          <span
            className={`text-sm font-medium ${
              stock <= 0 ? 'text-red-600' : stock <= 5 ? 'text-amber-600' : 'text-green-600'
            }`}
          >
            {stock}
          </span>
        );
      },
    },
    {
      header: 'Estado',
      cell: (row: Product) => (
        <span
          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
            row.isActive
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {row.isActive ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      header: 'Acciones',
      cell: (row: Product) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/admin/productos/${row.id}`}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary"
            title="Editar"
          >
            <Edit className="w-4 h-4" />
          </Link>
          <Link
            href={`/productos/${row.slug}`}
            target="_blank"
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary"
            title="Ver en tienda"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <button
            onClick={() => toggleActive.mutate(row)}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary"
            title={row.isActive ? 'Desactivar' : 'Activar'}
          >
            {row.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          </button>
        </div>
      ),
      className: 'w-28',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Productos</h1>
          <p className="text-sm text-muted-foreground">
            {totalCount} producto{totalCount !== 1 ? 's' : ''} en catálogo
          </p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Producto
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={products}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Buscar por nombre, SKU..."
        isLoading={isLoading}
      />
    </div>
  );
}
