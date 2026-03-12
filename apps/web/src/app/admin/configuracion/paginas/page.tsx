'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient as api } from '@/lib/api-client';
import DataTable from '@/components/admin/DataTable';
import { Plus, Eye, Trash2, Globe, GlobeLock } from 'lucide-react';

interface Page {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PaginasAdminPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  const { data: pages = [], isLoading } = useQuery<Page[]>({
    queryKey: ['admin-pages', filter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filter === 'published') params.published = 'true';
      if (filter === 'draft') params.published = 'false';
      const { data } = await api.get('/pages', { params });
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/pages/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-pages'] }),
  });

  const filtered = pages.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()),
  );

  const columns = [
    {
      header: 'Título',
      cell: (row: Page) => <span className="font-medium">{row.title}</span>,
    },
    {
      header: 'Slug',
      cell: (row: Page) => <span className="text-gray-500">/{row.slug}</span>,
    },
    {
      header: 'Estado',
      cell: (row: Page) =>
        row.isPublished ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Globe className="w-3 h-3" /> Publicada
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            <GlobeLock className="w-3 h-3" /> Borrador
          </span>
        ),
    },
    {
      header: 'Actualizada',
      cell: (row: Page) =>
        new Date(row.updatedAt).toLocaleDateString('es-GT'),
    },
    {
      header: '',
      cell: (row: Page) => (
        <div className="flex gap-2 justify-end">
          <Link
            href={`/admin/configuracion/paginas/${row.id}`}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <button
            onClick={() => {
              if (confirm('¿Eliminar esta página?')) deleteMutation.mutate(row.id);
            }}
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      className: 'w-24',
    },
  ];

  const filters: { label: string; value: typeof filter }[] = [
    { label: 'Todas', value: 'all' },
    { label: 'Publicadas', value: 'published' },
    { label: 'Borradores', value: 'draft' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Páginas</h1>
        <Link
          href="/admin/configuracion/paginas/nueva"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition"
        >
          <Plus className="w-4 h-4" /> Nueva Página
        </Link>
      </div>

      <div className="flex gap-2 mb-4">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition ${
              filter === f.value
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        totalCount={filtered.length}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar página..."
        isLoading={isLoading}
      />
    </div>
  );
}
