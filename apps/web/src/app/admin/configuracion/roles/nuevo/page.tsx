'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { apiClient as api } from '@/lib/api-client';

const RESOURCE_LABELS: Record<string, string> = {
  product: 'Productos',
  category: 'Categorías',
  brand: 'Marcas',
  order: 'Pedidos',
  inventory: 'Inventario',
  supplier: 'Proveedores',
  purchase_order: 'Órdenes de Compra',
  user: 'Usuarios',
  settings: 'Configuración',
  report: 'Reportes',
  promotion: 'Promociones',
  prescription: 'Recetas',
};

const ACTION_LABELS: Record<string, string> = {
  manage: 'Gestión Total',
  create: 'Crear',
  read: 'Leer',
  update: 'Editar',
  delete: 'Eliminar',
  update_status: 'Cambiar Estado',
  verify_payment: 'Verificar Pago',
  view_movements: 'Ver Movimientos',
  manage_roles: 'Gestionar Roles',
  update_general: 'Configuración General',
  manage_pages: 'Gestionar Páginas',
  view_sales: 'Ver Ventas',
  view_all: 'Ver Todos',
};

export default function NewRolePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());

  const { data: permGroups, isLoading } = useQuery({
    queryKey: ['admin-permissions'],
    queryFn: () => api.get('/roles/permissions').then((r) => r.data),
  });

  const createRole = useMutation({
    mutationFn: () =>
      api.post('/roles', {
        name,
        displayName,
        description: description || undefined,
        permissionIds: Array.from(selectedPerms),
      }),
    onSuccess: () => router.push('/admin/configuracion/roles'),
  });

  const togglePerm = (id: string) =>
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleResource = (perms: { id: string }[]) => {
    const ids = perms.map((p) => p.id);
    const allSelected = ids.every((id) => selectedPerms.has(id));
    setSelectedPerms((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (allSelected) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const resources = Object.entries(
    permGroups as Record<string, { id: string; action: string; description: string | null }[]>,
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/configuracion/roles" className="p-2 rounded-lg hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nuevo Rol</h1>
          <p className="text-sm text-muted-foreground">Define nombre y permisos</p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createRole.mutate();
        }}
        className="space-y-6"
      >
        {/* Info */}
        <div className="bg-white rounded-xl border border-border p-5 space-y-4">
          <h2 className="text-sm font-semibold">Información del Rol</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Nombre técnico *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="ej: warehouse_manager"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Nombre para mostrar *
              </label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder="ej: Encargado de Bodega"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Descripción
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción del rol..."
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Permission Matrix */}
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Permisos ({selectedPerms.size} seleccionados)</h2>
          </div>
          <div className="space-y-3">
            {resources.map(([resource, perms]) => {
              const allSelected = perms.every((p) => selectedPerms.has(p.id));
              const someSelected = perms.some((p) => selectedPerms.has(p.id));
              return (
                <div key={resource} className="border border-border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected && !allSelected;
                      }}
                      onChange={() => toggleResource(perms)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium">
                      {RESOURCE_LABELS[resource] || resource}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">{resource}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 ml-7">
                    {perms.map((perm) => (
                      <label key={perm.id} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedPerms.has(perm.id)}
                          onChange={() => togglePerm(perm.id)}
                          className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-xs text-muted-foreground">
                          {ACTION_LABELS[perm.action] || perm.action}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/admin/configuracion/roles"
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={createRole.isPending}
            className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {createRole.isPending ? 'Creando...' : 'Crear Rol'}
          </button>
        </div>

        {createRole.isError && (
          <p className="text-sm text-destructive">
            Error al crear el rol. Verifica los campos e intenta de nuevo.
          </p>
        )}
      </form>
    </div>
  );
}
