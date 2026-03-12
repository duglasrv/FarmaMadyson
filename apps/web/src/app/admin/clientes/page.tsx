'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Eye, ShieldCheck, ShieldOff, Search } from 'lucide-react';
import { apiClient as api } from '@/lib/api-client';
import Link from 'next/link';

interface UserRole {
  id: string;
  name: string;
  displayName: string;
}

interface UserItem {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  roles: UserRole[];
  orderCount: number;
}

interface UserListResponse {
  data: UserItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const roleColors: Record<string, string> = {
  super_admin: 'bg-red-50 text-red-700',
  admin: 'bg-purple-50 text-purple-700',
  pharmacist: 'bg-blue-50 text-blue-700',
  customer: 'bg-gray-100 text-gray-600',
};

export default function AdminClientesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filterRole, setFilterRole] = useState('');
  const [filterActive, setFilterActive] = useState<string>('');
  const limit = 20;

  const { data, isLoading } = useQuery<UserListResponse>({
    queryKey: ['admin-users', page, search, filterRole, filterActive],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (search) params.set('search', search);
      if (filterRole) params.set('role', filterRole);
      if (filterActive) params.set('isActive', filterActive);
      return api.get(`/users?${params.toString()}`).then((r) => r.data);
    },
  });

  const users = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, limit, totalPages: 1 };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          {meta.total} usuario{meta.total !== 1 ? 's' : ''} registrado{meta.total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border">
          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5 w-full max-w-sm">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar por nombre, email, teléfono..."
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>

          <select
            value={filterRole}
            onChange={(e) => { setFilterRole(e.target.value); setPage(1); }}
            className="px-3 py-1.5 border border-border rounded-lg text-sm bg-white"
          >
            <option value="">Todos los roles</option>
            <option value="customer">Cliente</option>
            <option value="pharmacist">Farmacéutico</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>

          <select
            value={filterActive}
            onChange={(e) => { setFilterActive(e.target.value); setPage(1); }}
            className="px-3 py-1.5 border border-border rounded-lg text-sm bg-white"
          >
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="px-4 py-3 font-medium text-xs uppercase">Usuario</th>
                <th className="px-4 py-3 font-medium text-xs uppercase">Contacto</th>
                <th className="px-4 py-3 font-medium text-xs uppercase">Roles</th>
                <th className="px-4 py-3 font-medium text-xs uppercase">Pedidos</th>
                <th className="px-4 py-3 font-medium text-xs uppercase">Estado</th>
                <th className="px-4 py-3 font-medium text-xs uppercase">Último acceso</th>
                <th className="px-4 py-3 font-medium text-xs uppercase w-20">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-muted-foreground">Cargando...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>No se encontraron usuarios</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
                          {String(user.firstName?.[0] || user.email.charAt(0) || '?').toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : user.email.split('@')[0]}
                          </p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {user.phone || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.length > 0 ? (
                          user.roles.map((r) => {
                            const c = roleColors[r.name];
                            const color = c ? c : 'bg-gray-100 text-gray-600';
                            return (
                              <span key={r.id} className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${color}`}>
                                {r.displayName}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin rol</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-medium">{user.orderCount}</td>
                    <td className="px-4 py-3">
                      {user.isActive ? (
                        <span className="flex items-center gap-1 text-green-700 text-xs">
                          <ShieldCheck className="w-3.5 h-3.5" /> Activo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600 text-xs">
                          <ShieldOff className="w-3.5 h-3.5" /> Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString('es-GT', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Nunca'}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/clientes/${user.id}`}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary inline-flex"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Mostrando {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} de {meta.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
              >
                «
              </button>
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ‹
              </button>
              <span className="px-3 text-sm font-medium">{page} / {meta.totalPages}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= meta.totalPages}
                className="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ›
              </button>
              <button
                onClick={() => setPage(meta.totalPages)}
                disabled={page >= meta.totalPages}
                className="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
