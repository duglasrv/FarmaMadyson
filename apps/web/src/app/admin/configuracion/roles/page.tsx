'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Edit, Shield, Users } from 'lucide-react';
import { apiClient as api } from '@/lib/api-client';

interface RoleItem {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isSystem: boolean;
  userCount: number;
  permissions: { id: string; resource: string; action: string }[];
}

export default function AdminRolesPage() {
  const { data: roles, isLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => api.get('/roles').then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Roles y Permisos</h1>
          <p className="text-sm text-muted-foreground">Gestiona los roles de acceso del sistema</p>
        </div>
        <Link
          href="/admin/configuracion/roles/nuevo"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Rol
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(roles || []).map((role: RoleItem) => (
          <div
            key={role.id}
            className="bg-white rounded-xl border border-border p-5 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{role.displayName}</h3>
                  <p className="text-[10px] text-muted-foreground font-mono">{role.name}</p>
                </div>
              </div>
              {role.isSystem && (
                <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] text-muted-foreground font-medium">
                  Sistema
                </span>
              )}
            </div>

            {role.description && (
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{role.description}</p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {role.userCount} usuario{role.userCount !== 1 ? 's' : ''}
                </span>
                <span>{role.permissions.length} permisos</span>
              </div>
              <Link
                href={`/admin/configuracion/roles/${role.id}`}
                className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary"
              >
                <Edit className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
